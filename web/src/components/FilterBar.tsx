import type { Status } from '../types';
import { PILL_ORDER, STATUS } from '../status';
import { hexA } from '../util';

const ACCENT = '#F0603A';

export function FilterBar({
  counts,
  total,
  filter,
  setFilter,
  summaryText,
}: {
  counts: Record<Status, number>;
  total: number;
  filter: Status | null;
  setFilter: (s: Status | null) => void;
  summaryText: string;
}) {
  const allActive = !filter;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 20px',
        background: '#0F1012',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        overflowX: 'auto',
      }}
    >
      <button
        className="pill"
        onClick={() => setFilter(null)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '6px 13px',
          borderRadius: 999,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          border: `1px solid ${allActive ? hexA(ACCENT, 0.5) : 'rgba(255,255,255,0.08)'}`,
          background: allActive ? hexA(ACCENT, 0.16) : '#1A1B1E',
          color: allActive ? '#fff' : '#B8B9BD',
        }}
      >
        alles
        <span style={{ opacity: 0.55, marginLeft: 6, fontVariantNumeric: 'tabular-nums' }}>{total}</span>
      </button>

      {PILL_ORDER.filter((k) => counts[k] > 0).map((k) => {
        const def = STATUS[k];
        const active = filter === k;
        return (
          <button
            key={k}
            className="pill"
            onClick={() => setFilter(active ? null : k)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: `1px solid ${active ? hexA(def.color, 0.5) : 'rgba(255,255,255,0.08)'}`,
              background: active ? hexA(def.color, 0.16) : '#1A1B1E',
              color: active ? '#fff' : '#B8B9BD',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: def.color,
                display: 'inline-block',
                flexShrink: 0,
                animation: def.attention ? 'pulseSoft 1.8s ease-in-out infinite' : 'none',
              }}
            />
            {def.short}
            <span style={{ opacity: 0.65, marginLeft: 1, fontVariantNumeric: 'tabular-nums' }}>{counts[k]}</span>
          </button>
        );
      })}

      <div style={{ flex: 1, minWidth: 16 }} />
      <span style={{ fontSize: 12, color: '#6B6C70', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {summaryText}
      </span>
    </div>
  );
}
