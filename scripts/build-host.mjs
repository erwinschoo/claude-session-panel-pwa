// Bouwt de losstaande host-.exe:
//   1) web-build (base '/')  2) assets embedden  3) esbuild → CJS-bundle  4) pkg → .exe
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// npm is een .cmd op Windows → shell:true (anders EINVAL sinds Node 20.12).
// Args bevatten zelf geen spaties; cwd wordt niet door de shell geparsed.
const npm = (args, env) =>
  execFileSync('npm', args, { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, ...env } });
// node-script: zonder shell zodat paden met spaties intact blijven.
const node = (scriptPath) => execFileSync(process.execPath, [scriptPath], { cwd: root, stdio: 'inherit' });

console.log('· web-build (base /) …');
npm(['run', 'build', '--workspace', 'web'], { VITE_BASE: '/' });

console.log('· assets embedden …');
node(path.join(root, 'scripts', 'embed-assets.mjs'));

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
  external: ['fsevents'], // optionele macOS-native dep van chokidar
  logLevel: 'info',
});

console.log('· pkg → .exe …');
const exeDir = path.join(root, 'dist-exe');
fs.mkdirSync(exeDir, { recursive: true });
const exe = path.join(exeDir, 'session-panel-host.exe');
// Programmatische pkg-API: geen .cmd-spawn, args als array (paden met spaties veilig).
const pkg = await import('@yao-pkg/pkg');
await pkg.exec([outCjs, '--targets', 'node20-win-x64', '--output', exe]);

console.log(`\n✓ klaar: ${exe}`);
