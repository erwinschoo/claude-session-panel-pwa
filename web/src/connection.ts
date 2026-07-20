// Verbindingslaag: de app praat met een instelbare backend (companion).
// - base = '' → same-origin (de host serveert de PWA zelf)
// - base = 'http://192.168.1.20:4317' of 'https://laptop.tailnet.ts.net' → externe host
// token wordt als query meegestuurd (WS kan geen headers zetten in de browser).

const BASE_KEY = 'panel_backend';
const TOKEN_KEY = 'panel_token';

// Auto-configuratie via query params bij openen (bv. gescande QR of deep-link):
//   ?base=<url>&token=<token>   of alleen ?token=<token> (same-origin host)
(function consumeQueryParams() {
  try {
    const p = new URLSearchParams(location.search);
    let changed = false;
    if (p.has('base')) {
      localStorage.setItem(BASE_KEY, normalizeBase(p.get('base') || ''));
      changed = true;
    }
    if (p.has('token')) {
      localStorage.setItem(TOKEN_KEY, p.get('token') || '');
      changed = true;
    }
    if (changed) {
      p.delete('base');
      p.delete('token');
      const q = p.toString();
      history.replaceState(null, '', location.pathname + (q ? `?${q}` : '') + location.hash);
    }
  } catch {
    /* ignore */
  }
})();

function normalizeBase(base: string): string {
  return base.trim().replace(/\/+$/, '');
}

export function getBase(): string {
  try {
    return localStorage.getItem(BASE_KEY) || '';
  } catch {
    return '';
  }
}

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setConnection(base: string, token: string): void {
  localStorage.setItem(BASE_KEY, normalizeBase(base));
  localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearConnection(): void {
  localStorage.removeItem(BASE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/** Is er expliciet een externe host ingesteld? (false = same-origin proberen) */
export function hasExplicitBase(): boolean {
  return !!getBase();
}

function tokenQuery(hasQ: boolean): string {
  const t = getToken();
  return t ? `${hasQ ? '&' : '?'}token=${encodeURIComponent(t)}` : '';
}

export function apiUrl(path: string): string {
  const root = getBase(); // '' = same-origin
  return `${root}${path}${tokenQuery(path.includes('?'))}`;
}

export function wsUrl(): string {
  const base = getBase();
  let origin: string;
  if (base) {
    origin = base.replace(/^http/, 'ws'); // https->wss, http->ws
  } else {
    origin = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`;
  }
  return `${origin}/ws${tokenQuery(false)}`;
}

/** Health-check: bereikbaar + (indien nodig) token geldig. */
export async function probe(base: string, token: string): Promise<'ok' | 'unauthorized' | 'unreachable'> {
  const root = normalizeBase(base);
  const url = `${root}/api/info${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  try {
    const r = await fetch(url, { method: 'GET' });
    if (r.status === 401) return 'unauthorized';
    return r.ok ? 'ok' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}
