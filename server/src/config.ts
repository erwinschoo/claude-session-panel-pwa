import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Runtime-state (o.a. auto-gegenereerd token) — in de home-map, zodat het ook werkt
// vanuit de gepackte .exe (waar de snapshot-FS read-only is).
const runtimeFile = path.join(os.homedir(), '.claude-session-panel.json');

function loadRuntime(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(runtimeFile, 'utf8'));
  } catch {
    return {};
  }
}
function saveRuntime(data: Record<string, string>): void {
  try {
    fs.writeFileSync(runtimeFile, JSON.stringify(data, null, 2));
  } catch {
    /* niet-fataal */
  }
}

// Draaien we als gepackte .exe (pkg)? Dan is dit "de app": bind op alle interfaces zodat
// telefoon/andere PC erbij kunnen, en open standaard het app-venster. Robuuste detectie:
// pkg zet `process.pkg`; anders is de executable niet 'node' (maar session-panel-host.exe).
const execName = path.basename(process.execPath).toLowerCase();
export const packaged = !!(process as any).pkg || (execName !== 'node.exe' && execName !== 'node');

// De .exe bindt standaard op 0.0.0.0 (LAN-bereikbaar); vanuit broncode op localhost.
const host = process.env.HOST ?? (packaged ? '0.0.0.0' : '127.0.0.1');
export const isLocalOnly = host === '127.0.0.1' || host === 'localhost' || host === '::1';

// Token: expliciet uit .env, anders persistent auto-gegenereerd (nodig zodra niet-localhost).
function resolveToken(): string {
  const fromEnv = process.env.AUTH_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  if (isLocalOnly) return ''; // localhost heeft geen token nodig
  const rt = loadRuntime();
  if (rt.token) return rt.token;
  const token = crypto.randomBytes(12).toString('base64url');
  saveRuntime({ ...rt, token });
  return token;
}

// Toegestane cross-origin herkomsten voor de PWA (bv. GitHub Pages).
const defaultOrigins = ['https://erwinschoo.github.io'];
function resolveOrigins(): string[] {
  const extra = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...defaultOrigins, ...extra])];
}

export const config = {
  port: Number(process.env.PORT ?? 4317),
  host,
  authToken: resolveToken(),
  codeBin: process.env.CODE_BIN?.trim() || 'code',
  allowedOrigins: resolveOrigins(),
  // Open het dashboard automatisch (app-venster). Default aan in de .exe; env kan forceren.
  openApp: process.env.OPEN_APP ? process.env.OPEN_APP === '1' : packaged,
  // Zet `tailscale serve` automatisch op zodra Tailscale gedetecteerd is (tenzij uitgezet).
  tailscaleServe: process.env.NO_TAILSCALE !== '1',
};

/** Mag deze Origin cross-origin verbinden? (loopback-origins altijd toegestaan.) */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // same-origin / native client (geen Origin-header)
  if (config.allowedOrigins.includes(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1') return true;
  } catch {
    /* ignore */
  }
  return false;
}
