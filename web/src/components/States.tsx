import type { CSSProperties } from 'react';
import { Icon } from './Icon';

const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
  gap: 14,
  padding: '18px 20px',
  alignContent: 'start',
};

export function SkeletonGrid() {
  const shimmer: CSSProperties = {
    background: 'linear-gradient(90deg,#1f2024 25%,#2a2b30 50%,#1f2024 75%)',
    backgroundSize: '900px 100%',
    animation: 'shimmer 1.4s linear infinite',
  };
  return (
    <div style={GRID}>
      {[1, 2, 3, 4, 5, 6].map((k) => (
        <div
          key={k}
          style={{
            background: '#1A1B1E',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ ...shimmer, width: 96, height: 22, borderRadius: 999 }} />
          <div style={{ ...shimmer, width: '75%', height: 15, borderRadius: 6 }} />
          <div style={{ ...shimmer, width: '88%', height: 11, borderRadius: 6 }} />
          <div style={{ ...shimmer, width: '60%', height: 11, borderRadius: 6 }} />
          <div style={{ ...shimmer, width: '100%', height: 38, borderRadius: 8, marginTop: 4 }} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px',
        gap: 8,
        minHeight: '60vh',
      }}
    >
      <div
        style={{
          width: 70,
          height: 70,
          borderRadius: 20,
          background: '#1A1B1E',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3d3e42',
          marginBottom: 8,
        }}
      >
        <Icon name="inbox" size={32} color="#3d3e42" />
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#E4E4E4', letterSpacing: '-.01em' }}>geen actieve sessies</div>
      <div style={{ fontSize: 14, color: '#6B6C70', maxWidth: 340, lineHeight: 1.55 }}>
        start claude code in een VS Code window en de sessie verschijnt hier automatisch.
      </div>
      <div style={{ marginTop: 20, fontSize: 12.5, color: '#4a4b50', fontWeight: 600 }}>we commit. we deliver.</div>
    </div>
  );
}

export function DisconnectedBanner({ onReconnect }: { onReconnect: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '16px 20px 0',
        padding: '13px 16px',
        background: 'rgba(240,96,58,0.12)',
        border: '1px solid rgba(240,96,58,0.32)',
        borderRadius: 12,
        animation: 'fadeUp .2s ease',
      }}
    >
      <span style={{ color: '#F0603A', display: 'flex' }}>
        <Icon name="wifiOff" size={22} color="#F0603A" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#F5D9D0' }}>verbinding met companion kwijt</div>
        <div style={{ fontSize: 12.5, color: '#B99C93' }}>opnieuw verbinden…</div>
      </div>
      <button
        className="primary-btn"
        onClick={onReconnect}
        style={{
          padding: '8px 14px',
          background: '#F0603A',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 12.5,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        nu opnieuw verbinden
      </button>
    </div>
  );
}
