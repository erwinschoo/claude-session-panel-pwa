import os from 'node:os';
import path from 'node:path';

const home = os.homedir();
export const claudeDir = path.join(home, '.claude');
export const sessionsDir = path.join(claudeDir, 'sessions');
export const ideDir = path.join(claudeDir, 'ide');
export const projectsDir = path.join(claudeDir, 'projects');

/** Normaliseer een pad voor vergelijking (lowercase drive, forward slashes, geen trailing slash). */
export function normalizePath(p: string): string {
  if (!p) return '';
  let s = p.replace(/\\/g, '/').replace(/\/+$/, '');
  // Windows drive-letter naar lowercase (c:/... == C:\...)
  s = s.replace(/^([a-zA-Z]):/, (_m, d) => d.toLowerCase() + ':');
  return s.toLowerCase();
}

/** Korte, leesbare workspace-naam uit een pad (laatste segment). */
export function workspaceName(cwd: string): string {
  if (!cwd) return 'onbekend';
  const parts = cwd.replace(/\\/g, '/').replace(/\/+$/, '').split('/');
  return parts[parts.length - 1] || cwd;
}

/** Bestaat het proces nog? (werkt op Windows via process.kill(pid, 0)). */
export function isAlive(pid: number): boolean {
  if (!pid || Number.isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err: any) {
    // EPERM = proces bestaat maar we mogen geen signaal sturen -> leeft.
    return err?.code === 'EPERM';
  }
}
