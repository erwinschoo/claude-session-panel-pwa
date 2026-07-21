import os from 'node:os';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import qrcodeTerminal from 'qrcode-terminal';
import { detectTailscale, serveTailscale } from './tailscale.js';
import { isLocalOnly } from './config.js';

// Voorkeur: echte thuis-LAN (192.168.*) boven 10.*/172.*; sluit APIPA link-local (169.254.*)
// en Tailscale-CGNAT (100.64–100.127) uit — die horen niet in de LAN-lijst.
function isTailscaleCgnat(ip: string): boolean {
  const m = ip.match(/^100\.(\d+)\./);
  return !!m && Number(m[1]) >= 64 && Number(m[1]) <= 127;
}
function rank(ip: string): number {
  if (ip.startsWith('192.168.')) return 0;
  if (ip.startsWith('10.')) return 1;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 2;
  return 3;
}

/** Bruikbare LAN-IPv4-adressen van deze machine, meest-waarschijnlijke eerst. */
export function lanIps(): string[] {
  const out: string[] = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const ni of ifaces[name] ?? []) {
      if (ni.family === 'IPv4' && !ni.internal && !ni.address.startsWith('169.254.') && !isTailscaleCgnat(ni.address)) {
        out.push(ni.address);
      }
    }
  }
  return out.sort((a, b) => rank(a) - rank(b));
}

function withToken(url: string, token: string): string {
  return token ? `${url}/?token=${encodeURIComponent(token)}` : `${url}/`;
}

function qr(url: string): void {
  try {
    qrcodeTerminal.generate(url, { small: true }, (code: string) => console.log(code));
  } catch {
    /* niet-fataal — sla QR over */
  }
}

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

/** Open het dashboard als chromeless app-venster (Edge/Chrome --app), anders standaardbrowser. */
export function openApp(url: string): void {
  const bin = [...EDGE, ...CHROME].find((p) => fs.existsSync(p));
  try {
    if (bin) {
      spawn(bin, [`--app=${url}`, '--new-window'], { detached: true, stdio: 'ignore', windowsHide: false }).unref();
    } else {
      spawn('cmd', ['/c', 'start', '', url], { windowsHide: true, stdio: 'ignore', detached: true }).unref();
    }
  } catch {
    /* niet-fataal */
  }
}

/** Print de bereikbare URL's + token + QR('s); regelt Tailscale-serve. Geeft de lokale app-URL terug. */
export function printHostInfo(port: number, token: string, tailscaleServe: boolean): { appUrl: string } {
  const ips = lanIps();
  const bestLan = ips[0];
  const ts = detectTailscale();
  let tsUrl: string | null = null;
  if (ts) {
    if (tailscaleServe) {
      tsUrl = serveTailscale(port) ? `https://${ts.dnsName}` : null;
    }
  }

  console.log('\n────────────────────────────────────────────');
  console.log(' claude session panel · host draait');
  console.log('────────────────────────────────────────────');
  console.log(` op deze pc  : http://localhost:${port}`);
  if (bestLan) console.log(` zelfde WiFi : http://${bestLan}:${port}`);
  const extra = ips.slice(1);
  if (extra.length) console.log(`               (ook: ${extra.map((ip) => `http://${ip}:${port}`).join('  ')})`);
  if (tsUrl) {
    console.log(` buiten WiFi : ${tsUrl}   (Tailscale, actief)`);
  } else if (ts) {
    console.log(` buiten WiFi : https://${ts.dnsName}   (draai eenmalig: \`tailscale serve ${port}\`)`);
  } else {
    console.log(' buiten WiFi : installeer Tailscale op beide apparaten (zie README)');
  }
  if (token) console.log(` token       : ${token}`);
  console.log('────────────────────────────────────────────');

  if (!isLocalOnly) {
    console.log(' ⚠ verbindt je telefoon/andere PC niet? sta "session-panel-host" toe in');
    console.log('   Windows Firewall (privé netwerk) — Windows vraagt dit meestal bij de start.');
    console.log('────────────────────────────────────────────');
  }

  if (bestLan) {
    console.log(' scan op je telefoon (zelfde WiFi):');
    const lanUrl = withToken(`http://${bestLan}:${port}`, token);
    qr(lanUrl);
    console.log(` ${lanUrl}`);
  }
  if (tsUrl) {
    console.log('\n scan op je telefoon (buiten WiFi, via Tailscale):');
    const url = withToken(tsUrl, token);
    qr(url);
    console.log(` ${url}`);
  }
  console.log('');

  return { appUrl: withToken(`http://localhost:${port}`, token) };
}
