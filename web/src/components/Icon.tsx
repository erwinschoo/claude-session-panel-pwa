import React from 'react';

// Rounded-stroke SVG-iconen (Lucide-stijl), geport uit het ontwerp.
const P = (d: string, k?: string) => <path d={d} key={k || d.slice(0, 7)} />;
const C = (cx: number, cy: number, r: number, k: string) => <circle cx={cx} cy={cy} r={r} key={k} />;
const L = (x1: number, y1: number, x2: number, y2: number, k: string) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} key={k} />
);
const R = (x: number, y: number, w: number, h: number, rx: number, k: string) => (
  <rect x={x} y={y} width={w} height={h} rx={rx} key={k} />
);

const KIDS: Record<string, React.ReactNode[]> = {
  shield: [P('M12 3l7 3v5c0 4.2-2.9 7.4-7 8.6C7.9 18.4 5 15.2 5 11V6l7-3z'), P('M9.2 11.8l1.9 1.9 3.7-3.9', 'sc')],
  alert: [P('M10.3 4.3L2.5 18a1.7 1.7 0 0 0 1.5 2.5h16a1.7 1.7 0 0 0 1.5-2.5L13.7 4.3a1.7 1.7 0 0 0-3 0z'), L(12, 9, 12, 13, 'al'), P('M12 17h.01', 'ad')],
  input: [P('M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z'), L(8, 10, 16, 10, 'i1'), L(8, 13.5, 13, 13.5, 'i2')],
  spinner: [C(12, 12, 9, 's0'), P('M21 12a9 9 0 0 0-9-9', 'sa')],
  check: [C(12, 12, 9, 'ck'), P('M8 12.2l2.6 2.6L16 9', 'cc')],
  offline: [P('M18.4 6.6A9 9 0 1 1 5.6 6.6'), L(12, 3, 12, 12, 'ol')],
  gear: [C(12, 12, 3, 'g'), P('M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z')],
  clock: [C(12, 12, 9, 'cl'), P('M12 7.5V12l3 1.8', 'ch')],
  wifi: [P('M5 12.5a10 10 0 0 1 14 0'), P('M8.5 15.8a5.5 5.5 0 0 1 7 0', 'w2'), P('M12 19h.01', 'w3')],
  wifiOff: [L(2, 2, 22, 22, 'wo'), P('M8.5 15.8a5.5 5.5 0 0 1 7 0', 'o2'), P('M5 12.5a10 10 0 0 1 4-2.6', 'o3'), P('M16.7 11a10 10 0 0 1 2.3 1.5', 'o4'), P('M12 19h.01', 'o5')],
  copy: [R(9, 9, 11, 11, 2, 'cp'), P('M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1', 'c2')],
  external: [P('M15 3h6v6'), P('M10 14L21 3', 'e2'), P('M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'e3')],
  code: [P('M16 18l6-6-6-6'), P('M8 6l-6 6 6 6', 'c2')],
  x: [L(18, 6, 6, 18, 'x1'), L(6, 6, 18, 18, 'x2')],
  terminal: [P('M4 17l6-6-6-6'), L(12, 19, 20, 19, 't2')],
  inbox: [P('M22 12h-6l-2 3h-4l-2-3H2'), P('M5.5 5.5L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5z', 'ib')],
};

export type IconName = keyof typeof KIDS;

export function Icon({
  name,
  size = 16,
  color = 'currentColor',
  stroke = 2,
  spin = false,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
  spin?: boolean;
  style?: React.CSSProperties;
}) {
  const st: React.CSSProperties = { ...style };
  if (spin) {
    st.animation = 'sp .9s linear infinite';
    st.transformOrigin = '50% 50%';
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={st}
      aria-hidden
    >
      {KIDS[name]}
    </svg>
  );
}
