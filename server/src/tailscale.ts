import { execFileSync } from 'node:child_process';

const CANDIDATES = [
  'tailscale',
  'C:\\Program Files\\Tailscale\\tailscale.exe',
  'C:\\Program Files (x86)\\Tailscale\\tailscale.exe',
];

function run(bin: string, args: string[], timeout = 3000): string | null {
  try {
    return execFileSync(bin, args, { encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

// Onthoud welke binary werkte, zodat serve dezelfde gebruikt.
let workingBin: string | null = null;

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
      if (dns) {
        workingBin = bin;
        return { dnsName: dns.replace(/\.$/, '') };
      }
    } catch {
      /* volgende kandidaat */
    }
  }
  return null;
}

/**
 * Zet `tailscale serve` op zodat https://<dnsName> naar de lokale poort proxyt.
 * Geeft true bij succes. Vereist dat MagicDNS + HTTPS in de tailnet aan staan.
 */
export function serveTailscale(port: number): boolean {
  const bin = workingBin ?? CANDIDATES[0];
  // Nieuwere syntax eerst, dan een fallback voor oudere clients.
  const attempts = [
    ['serve', '--bg', String(port)],
    ['serve', '--bg', `http://localhost:${port}`],
  ];
  for (const args of attempts) {
    // serve kan iets langer duren (cert-provisioning) → ruimere timeout.
    const out = run(bin, args, 15000);
    if (out !== null) return true;
  }
  return false;
}
