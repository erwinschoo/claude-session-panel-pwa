import chokidar from 'chokidar';
import fs from 'node:fs';
import path from 'node:path';
import { ideDir, projectsDir, sessionsDir, normalizePath } from './claudeHome.js';
import type { Registry } from './registry.js';

function readJson(file: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function rescanIde(reg: Registry): void {
  let files: string[] = [];
  try {
    files = fs.readdirSync(ideDir).filter((f) => f.endsWith('.lock'));
  } catch {
    /* dir bestaat mogelijk niet */
  }
  const windows = [];
  for (const f of files) {
    const data = readJson(path.join(ideDir, f));
    if (!data) continue;
    const port = Number(f.replace(/\.lock$/i, ''));
    const folders: string[] = Array.isArray(data.workspaceFolders)
      ? data.workspaceFolders.map((p: string) => normalizePath(p))
      : [];
    // authToken bewust NIET meenemen -> blijft server-side / ongebruikt.
    windows.push({ port, pid: Number(data.pid) || 0, folders });
  }
  reg.setIdeWindows(windows);
}

export function startWatchers(reg: Registry): () => void {
  // 1) Live sessie-index: sessions/<pid>.json
  const wSessions = chokidar.watch(sessionsDir, {
    ignoreInitial: false,
    depth: 0,
    awaitWriteFinish: { stabilityThreshold: 120, pollInterval: 40 },
  });
  const onSession = (file: string) => {
    if (!file.endsWith('.json')) return;
    const data = readJson(file);
    if (!data || !data.sessionId) return;
    reg.upsertSession(String(data.sessionId), {
      pid: Number(data.pid) || 0,
      cwd: String(data.cwd || ''),
      name: String(data.name || ''),
      startedAt: Number(data.startedAt) || 0,
      entrypoint: String(data.entrypoint || ''),
    });
  };
  wSessions
    .on('add', onSession)
    .on('change', onSession)
    .on('unlink', (file) => {
      const pid = Number(path.basename(file).replace(/\.json$/i, ''));
      if (pid) reg.removeSessionByPid(pid);
    });

  // 2) VS Code windows: ide/<port>.lock
  const wIde = chokidar.watch(ideDir, { ignoreInitial: false, depth: 0 });
  wIde.on('add', () => rescanIde(reg)).on('change', () => rescanIde(reg)).on('unlink', () => rescanIde(reg));

  // 3) Transcripts: projects/<encoded>/<sessionId>.jsonl
  const wProjects = chokidar.watch(projectsDir, {
    ignoreInitial: false,
    depth: 3,
    awaitWriteFinish: { stabilityThreshold: 80, pollInterval: 30 },
  });
  const onTranscript = (file: string, isAdd: boolean) => {
    if (!file.endsWith('.jsonl')) return;
    const sessionId = reg.sessionIdForFile(file);
    if (!sessionId) return;
    if (isAdd) reg.setTranscriptPath(sessionId, file);
    else reg.refreshTranscript(sessionId);
  };
  wProjects.on('add', (f) => onTranscript(f, true)).on('change', (f) => onTranscript(f, false));

  return () => {
    wSessions.close();
    wIde.close();
    wProjects.close();
  };
}
