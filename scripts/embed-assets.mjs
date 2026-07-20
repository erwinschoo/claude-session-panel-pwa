// Leest web/dist en schrijft server/src/generated-assets.ts (base64-map) zodat de
// host-.exe de PWA als één losstaand bestand kan serveren.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'web', 'dist');
const outFile = path.join(root, 'server', 'src', 'generated-assets.ts');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function walk(dir, base = '') {
  const out = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) Object.assign(out, walk(abs, rel));
    else {
      const type = TYPES[path.extname(entry.name).toLowerCase()] || 'application/octet-stream';
      out[rel] = { type, base64: fs.readFileSync(abs).toString('base64') };
    }
  }
  return out;
}

if (!fs.existsSync(distDir)) {
  console.error('web/dist ontbreekt — draai eerst de web-build.');
  process.exit(1);
}

const assets = walk(distDir);
const body =
  '// AUTO-GEGENEREERD door scripts/embed-assets.mjs — niet handmatig bewerken.\n' +
  'export const ASSETS: Record<string, { type: string; base64: string }> = ' +
  JSON.stringify(assets) +
  ';\n';
fs.writeFileSync(outFile, body);
console.log(`embedded ${Object.keys(assets).length} assets → server/src/generated-assets.ts`);
