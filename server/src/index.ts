import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, isOriginAllowed } from './config.js';
import { Registry } from './registry.js';
import { startWatchers } from './watchers.js';
import { openVSCode } from './actions.js';
import { printHostInfo, openApp } from './host.js';
import { ASSETS } from './generated-assets.js';
import type { Status } from './types.js';

// web/dist op schijf (alleen dev). In de gepackte .exe wordt de PWA uit ASSETS geserveerd,
// en is import.meta.url leeg -> veilig afvangen.
function resolveWebDist(): string {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(dir, '../../web/dist');
  } catch {
    return '';
  }
}

const HOOK_STATUS: Record<string, Status> = {
  PermissionRequest: 'waiting_permission',
  Notification: 'waiting_input',
  StopFailure: 'error',
  PreToolUse: 'working',
  PostToolUse: 'working',
  UserPromptSubmit: 'working',
};

const reg = new Registry();
const stopWatchers = startWatchers(reg);
setInterval(() => reg.tick(), 3000);

function tokenFromReq(req: any): string {
  const auth = req.headers?.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7);
  const q = req.query?.token;
  return typeof q === 'string' ? q : '';
}
function authOk(req: any): boolean {
  if (!config.authToken) return true; // geen token ingesteld -> niet afdwingen (localhost)
  return tokenFromReq(req) === config.authToken;
}

async function main() {
  const app = Fastify({ logger: false });
  await app.register(fastifyWebsocket);

  // --- CORS + Private/Local Network Access (voor de PWA op github.io etc.) ---
  app.addHook('onRequest', async (req, reply) => {
    const origin = req.headers.origin as string | undefined;
    if (origin && isOriginAllowed(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Vary', 'Origin');
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      reply.header('Access-Control-Allow-Private-Network', 'true');
    }
    if (req.method === 'OPTIONS') reply.code(204).send();
  });

  // --- auth: token verplicht zodra we niet op localhost binden ---
  app.addHook('preHandler', async (req, reply) => {
    const url = req.url.split('?')[0];
    if (url.startsWith('/api') && !authOk(req)) {
      reply.code(401).send({ error: 'unauthorized' });
    }
  });

  // --- REST ---
  app.get('/api/info', async () => ({
    name: 'claude-session-panel',
    hostname: os.hostname(),
    requiresToken: !!config.authToken,
  }));

  app.get('/api/sessions', async () => ({ sessions: reg.snapshot() }));

  app.post('/api/sessions/:id/focus-window', async (req: any, reply) => {
    const s = reg.getSession(req.params.id);
    if (!s) return reply.code(404).send({ error: 'sessie niet gevonden' });
    try {
      await openVSCode(s.cwd);
      return { ok: true, workspace: s.workspace };
    } catch (err: any) {
      return reply.code(500).send({ error: String(err?.message || err) });
    }
  });

  app.get('/api/sessions/:id/resume-command', async (req: any, reply) => {
    const s = reg.getSession(req.params.id);
    if (!s) return reply.code(404).send({ error: 'sessie niet gevonden' });
    return { command: s.resumeCmd };
  });

  // --- Hooks (fase 2, optioneel): directe status uit Claude Code ---
  app.post('/hooks', async (req: any) => {
    const b = req.body ?? {};
    const status = HOOK_STATUS[b.hook_event_name];
    if (b.session_id && status) reg.applyHook(String(b.session_id), status);
    return { ok: true };
  });

  // --- WebSocket: snapshot + live diffs ---
  app.get('/ws', { websocket: true }, (socket, req) => {
    // WebSockets kennen geen CORS -> valideer Origin zelf (anti cross-site hijack).
    if (!isOriginAllowed(req.headers.origin as string | undefined)) {
      socket.close(4403, 'forbidden origin');
      return;
    }
    if (!authOk(req)) {
      socket.close(4401, 'unauthorized');
      return;
    }
    const send = (sessions: unknown) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: 'sessions', sessions }));
      }
    };
    send(reg.snapshot());
    const onUpdate = (sessions: unknown) => send(sessions);
    reg.on('update', onUpdate);
    socket.on('close', () => reg.off('update', onUpdate));
  });

  // --- static PWA: eerst embedded assets (exe), anders web/dist op schijf (dev) ---
  const hasEmbedded = Object.keys(ASSETS).length > 0;
  const webDist = resolveWebDist();
  if (hasEmbedded) {
    app.setNotFoundHandler((req, reply) => {
      const p = req.url.split('?')[0];
      if (p.startsWith('/api') || p.startsWith('/ws')) {
        return reply.code(404).send({ error: 'not found' });
      }
      const key = p === '/' ? 'index.html' : p.replace(/^\//, '');
      const asset = ASSETS[key] ?? ASSETS['index.html'];
      reply.type(asset.type).send(Buffer.from(asset.base64, 'base64'));
    });
  } else if (webDist && fs.existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api') || req.url.startsWith('/ws')) {
        reply.code(404).send({ error: 'not found' });
      } else {
        reply.sendFile('index.html');
      }
    });
  }

  const close = async () => {
    stopWatchers();
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    console.error('kon niet starten:', err);
    process.exit(1);
  }

  const { appUrl } = printHostInfo(config.port, config.authToken, config.tailscaleServe);
  if (!hasEmbedded && !(webDist && fs.existsSync(webDist))) {
    console.log('PWA nog niet gebouwd (web/dist ontbreekt). In dev draait de Vite-server apart.');
  }
  if (config.openApp) openApp(appUrl);
}

main();
