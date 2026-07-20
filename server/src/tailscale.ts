import { execFileSync } from 'node:child_process';

const CANDIDATES = [
  'tailscale',
  'C:\\Program Files\\Tailscale\\tailscale.exe',
  'C:\\Program Files (x86)\\Tailscale\\tailscale.exe',
];

function run(bin: string, args: string[]): string | null {
  try {
    return execFileSync(bin, args, { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

export interface TailscaleInfo {
  dnsName: string; // bv. laptop.tailnet-abc.ts.net (zonder trailing dot)
}

/** Detecteer of Tailscale draait en geef de MagicDNS-naam van dit device. */
export function detectTailscale(): TailscaleInfo | null {
  for (const bin of CANDIDATES) {
    const out = run(bin, ['status', '--json']);
    if (!out) continue;
    try {
      const data = JSON.parse(out);
      const dns: string | undefined = data?.Self?.DNSName;
      if (dns) return { dnsName: dns.replace(/\.$/, '') };
    } catch {
      /* volgende kandidaat */
    }
  }
  return null;
}
