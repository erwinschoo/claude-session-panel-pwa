import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, isLocalOnly } from './config.js';
import { Registry } from './registry.js';
import { startWatchers } from './watchers.js';
import { openVSCode } from './actions.js';
import type { Status } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, '../../web/dist');

const reg = new Registry();
const stopWatchers = startWatchers(reg);
setInterval(() => reg.tick(), 3000);

const app = Fastify({ logger: false });
await app.register(fastifyWebsocket);

// --- auth: token verplicht zodra we niet op localhost binden ---
function tokenFromReq(req: any): string {
  const auth = req.headers?.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7);
  const q = req.query?.token;
  return typeof q === 'string' ? q : '';
}
function authOk(req: any): boolean {
  if (isLocalOnly && !config.authToken) return true;
  if (!config.authToken) return true; // geen token ingesteld -> niet afdwingen
  return tokenFromReq(req) === config.authToken;
}
app.addHook('preHandler', async (req, reply) => {
  const url = req.url.split('?')[0];
  if (url.startsWith('/api') && !authOk(req)) {
    reply.code(401).send({ error: 'unauthorized' });
  }
});

// --- REST ---
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
const HOOK_STATUS: Record<string, Status> = {
  PermissionRequest: 'waiting_permission',
  Notification: 'waiting_input',
  StopFailure: 'error',
  PreToolUse: 'working',
  PostToolUse: 'working',
  UserPromptSubmit: 'working',
};
app.post('/hooks', async (req: any) => {
  const b = req.body ?? {};
  const event = b.hook_event_name;
  const sessionId = b.session_id;
  const status = HOOK_STATUS[event];
  if (sessionId && status) reg.applyHook(String(sessionId), status);
  return { ok: true };
});

// --- WebSocket: snapshot + live diffs ---
app.get('/ws', { websocket: true }, (socket, req) => {
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

// --- static PWA (indien gebouwd) ---
if (fs.existsSync(webDist)) {
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

app
  .listen({ port: config.port, host: config.host })
  .then(() => {
    const where = isLocalOnly ? `http://localhost:${config.port}` : `${config.host}:${config.port}`;
    console.log(`claude-session-panel · companion draait op ${where}`);
    if (!isLocalOnly && !config.authToken) {
      console.warn('WAARSCHUWING: niet-localhost binding zonder AUTH_TOKEN — zet er een in .env');
    }
    if (!fs.existsSync(webDist)) {
      console.log('PWA nog niet gebouwd (web/dist ontbreekt). In dev draait de Vite-server apart.');
    }
  })
  .catch((err) => {
    console.error('kon niet starten:', err);
    process.exit(1);
  });
