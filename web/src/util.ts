export function hexA(hex: string, a: number): string {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function fmtWait(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm';
  return Math.floor(m / 60) + 'u ' + (m % 60) + 'm';
}

export function fmtTok(n: number): string {
  if (n >= 1000) {
    const k = n >= 100000 ? Math.round(n / 1000) : +(n / 1000).toFixed(1);
    return String(k).replace(/\.0$/, '') + 'k';
  }
  return String(n);
}

export function fmtCost(n: number): string {
  return '$' + n.toFixed(2);
}
