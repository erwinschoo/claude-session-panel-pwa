import type { Session } from '../types';
import { STATUS } from '../status';
import { Icon } from './Icon';
import { fmtCost, fmtTok, fmtWait, hexA } from '../util';

const ACCENT = '#F0603A';

export function SessionCard({
  s,
  now,
  showPreview,
  reduceMotion,
  onOpen,
  onOpenVSCode,
}: {
  s: Session;
  now: number;
  showPreview: boolean;
  reduceMotion: boolean;
  onOpen: () => void;
  onOpenVSCode: () => void;
}) {
  const def = STATUS[s.status];
  const att = def.attention;
  const pulse = !reduceMotion;
  const waitLabel = s.attentionSince ? fmtWait(now - s.attentionSince) : null;

  return (
    <div
      className="card"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{
        position: 'relative',
        background: '#1A1B1E',
        border: `1px solid ${att ? hexA(def.color, 0.28) : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 12,
        padding: '14px 16px 14px 19px',
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: att
          ? `0 0 0 1px ${hexA(def.color, 0.18)},0 8px 28px -14px ${hexA(def.color, 0.6)}`
          : '0 1px 2px rgba(0,0,0,0.25)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: def.color,
          animation: att && pulse ? 'pulseStrong 1.8s ease-in-out infinite' : 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px 4px 8px',
            borderRadius: 999,
            background: hexA(def.color, 0.14),
            color: def.color,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Icon name={def.icon} size={14} color={def.color} spin={def.icon === 'spinner' && !reduceMotion} />
          {def.short}
        </span>
        <div style={{ flex: 1 }} />
        {att && waitLabel && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
              color: def.color,
              fontWeight: 600,
              animation: pulse ? 'pulseSoft 1.8s ease-in-out infinite' : 'none',
            }}
          >
            wacht {waitLabel}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#ECECEC',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '-.005em',
        }}
      >
        {s.title || s.workspace}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 5,
          fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
          fontSize: 11.5,
          color: '#75767b',
          lineHeight: 1.3,
        }}
      >
        <span>{s.workspace}</span>
        {s.branch && (
          <>
            <span style={{ opacity: 0.4 }}>·</span>
            <span style={{ color: '#9a9ba0' }}>{s.branch}</span>
          </>
        )}
        {s.model && (
          <>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>
              {s.model} {s.effort}
            </span>
          </>
        )}
      </div>

      {showPreview && s.lastMessage && (
        <div
          style={{
            fontSize: 12.5,
            color: '#6B6C70',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {s.lastMessage}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 11, color: '#5f6065', marginTop: 1 }}>
        {s.permissionMode && (
          <span
            style={{
              padding: '2px 7px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 5,
              fontFamily: 'ui-monospace,Menlo,monospace',
              color: '#8a8b90',
            }}
          >
            {s.permissionMode}
          </span>
        )}
        {s.tokens > 0 && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtTok(s.tokens)} tok</span>}
        {s.cost > 0 && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCost(s.cost)}</span>}
        <div style={{ flex: 1 }} />
        <span
          title="remote control"
          style={{
            fontSize: 10.5,
            color: s.remote ? '#72C4BF' : '#4a4b50',
            fontWeight: 600,
            letterSpacing: '.02em',
          }}
        >
          {s.remote ? '● remote' : '○ lokaal'}
        </span>
      </div>

      <button
        className="primary-btn"
        onClick={(e) => {
          e.stopPropagation();
          onOpenVSCode();
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          height: 40,
          background: ACCENT,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: 3,
        }}
      >
        <Icon name="code" size={15} color="#fff" /> open VS Code
      </button>
    </div>
  );
}
