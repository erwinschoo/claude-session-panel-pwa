// Bouwt de losstaande host-.exe:
//   1) web-build (base '/')  2) assets embedden  3) esbuild → CJS-bundle  4) pkg → .exe
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (cmd, args, env) =>
  execFileSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });

console.log('· web-build (base /) …');
run(npm, ['run', 'build', '--workspace', 'web'], { VITE_BASE: '/' });

console.log('· assets embedden …');
run(process.execPath, [path.join(root, 'scripts', 'embed-assets.mjs')]);

console.log('· esbuild server-bundle …');
const outCjs = path.join(root, 'build', 'host.cjs');
fs.mkdirSync(path.dirname(outCjs), { recursive: true });
await build({
  entryPoints: [path.join(root, 'server', 'src', 'index.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  outfile: outCjs,
  // fsevents is een optionele macOS-native dep van chokidar — niet nodig op Windows.
  external: ['fsevents'],
  logLevel: 'info',
});

console.log('· pkg → .exe …');
const exeDir = path.join(root, 'dist-exe');
fs.mkdirSync(exeDir, { recursive: true });
const exe = path.join(exeDir, 'session-panel-host.exe');
run(npm, ['exec', '--', '@yao-pkg/pkg', outCjs, '--targets', 'node20-win-x64', '--output', exe]);

console.log(`\n✓ klaar: ${exe}`);
