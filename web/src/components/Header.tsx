import { Icon } from './Icon';

const ACCENT = '#F0603A';

export function Header({
  attentionCount,
  clock,
  connected,
  onToggleWs,
  onOpenSettings,
}: {
  attentionCount: number;
  clock: string;
  connected: boolean;
  onToggleWs: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 20px',
        background: 'rgba(15,16,18,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <img src={`${import.meta.env.BASE_URL}icons/dee.svg`} alt="" height={24} width={24} />
          {attentionCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -7,
                right: -9,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 999,
                background: ACCENT,
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #0F1012',
                lineHeight: 1,
                animation: 'pulseSoft 1.8s ease-in-out infinite',
              }}
            >
              {attentionCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#F5F5F5', letterSpacing: '-.01em' }}>
            session panel
          </span>
          <span style={{ fontSize: 10.5, color: '#6B6C70', fontWeight: 500, letterSpacing: '.02em' }}>
            claude code · multi-window
          </span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
          fontSize: 13,
          color: '#B8B9BD',
          padding: '7px 11px',
          background: '#1A1B1E',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
        }}
      >
        <Icon name="clock" size={14} color="#8a8b90" />
        <span style={{ letterSpacing: '.02em' }}>{clock}</span>
      </div>
      <button
        onClick={onToggleWs}
        title="verbindingsstatus"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          height: 36,
          padding: '0 12px',
          background: '#1A1B1E',
          border: `1px solid ${connected ? 'rgba(114,196,191,0.3)' : 'rgba(245,158,11,0.35)'}`,
          borderRadius: 8,
          color: connected ? '#72C4BF' : '#F59E0B',
          cursor: 'pointer',
        }}
      >
        <Icon name={connected ? 'wifi' : 'wifiOff'} size={15} color={connected ? '#72C4BF' : '#F59E0B'} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>{connected ? 'verbonden' : 'verbinden…'}</span>
      </button>
      <button
        onClick={onOpenSettings}
        className="icon-btn"
        title="instellingen"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 36,
          width: 36,
          background: '#1A1B1E',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          color: '#B8B9BD',
          cursor: 'pointer',
        }}
      >
        <Icon name="gear" size={17} color="#B8B9BD" />
      </button>
    </div>
  );
}
