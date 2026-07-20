import os from 'node:os';
import { spawn } from 'node:child_process';
import qrcodeTerminal from 'qrcode-terminal';
import { detectTailscale } from './tailscale.js';

// Voorkeur: echte thuis-LAN (192.168.*) boven 10.*/172.* en vEthernet/WSL; sluit
// APIPA link-local (169.254.*) uit — dat is geen bruikbaar LAN-adres.
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
      if (ni.family === 'IPv4' && !ni.internal && !ni.address.startsWith('169.254.')) {
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

export function openBrowser(url: string): void {
  try {
    // Windows: `cmd /c start "" <url>`
    spawn('cmd', ['/c', 'start', '', url], { windowsHide: true, stdio: 'ignore', detached: true }).unref();
  } catch {
    /* niet-fataal */
  }
}

/** Print de bereikbare URL's + token + QR bij het opstarten van de host. */
export function printHostInfo(port: number, token: string): { primaryUrl: string } {
  const ips = lanIps();
  const ts = detectTailscale();

  console.log('\n────────────────────────────────────────────');
  console.log(' claude session panel · host draait');
  console.log('────────────────────────────────────────────');
  console.log(` lokaal      : http://localhost:${port}`);
  for (const ip of ips) console.log(` LAN         : http://${ip}:${port}`);
  if (ts) {
    console.log(` tailscale   : https://${ts.dnsName}  (vereist: \`tailscale serve ${port}\`)`);
  } else {
    console.log(' tailscale   : niet gedetecteerd (voor buiten-huis: installeer Tailscale +');
    console.log(`               \`tailscale serve ${port}\`)`);
  }
  if (token) console.log(` token       : ${token}`);
  console.log('────────────────────────────────────────────');

  // QR van de eerste LAN-URL (of localhost) zodat je 'm op je telefoon kunt scannen.
  const base = ips[0] ? `http://${ips[0]}:${port}` : `http://localhost:${port}`;
  const primaryUrl = withToken(base, token);
  console.log(' scan om te openen op je telefoon (zelfde WiFi):');
  qr(primaryUrl);
  console.log(` ${primaryUrl}\n`);

  return { primaryUrl };
}
