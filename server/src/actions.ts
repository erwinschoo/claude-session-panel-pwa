import { spawn } from 'node:child_process';
import { config } from './config.js';

/**
 * Focus/open de VS Code window voor een workspace-map.
 * `code -r <folder>` hergebruikt een bestaande window voor die map.
 */
export function openVSCode(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!cwd) return reject(new Error('geen cwd'));
    // shell:true zodat 'code' (code.cmd op Windows) via PATH gevonden wordt.
    const child = spawn(config.codeBin, ['-r', cwd], {
      shell: true,
      windowsHide: true,
      stdio: 'ignore',
    });
    child.on('error', reject);
    // niet wachten op afsluiten; VS Code blijft draaien.
    child.unref();
    resolve();
  });
}

export function resumeCommand(sessionId: string): string {
  return `claude --resume ${sessionId}`;
}
