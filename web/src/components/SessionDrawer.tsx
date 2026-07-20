import type { Session } from '../types';
import { STATUS } from '../status';
import { Icon } from './Icon';
import { fmtCost, fmtTok, fmtWait, hexA } from '../util';

const ACCENT = '#F0603A';

export function SessionDrawer({
  s,
  now,
  reduceMotion,
  onClose,
  onOpenVSCode,
  onCopyResume,
  onOpenClaude,
}: {
  s: Session;
  now: number;
  reduceMotion: boolean;
  onClose: () => void;
  onOpenVSCode: () => void;
  onCopyResume: () => void;
  onOpenClaude: () => void;
}) {
  const def = STATUS[s.status];
  const waitLabel = s.attentionSince ? fmtWait(now - s.attentionSince) : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 40,
        animation: 'overlayIn .18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(460px,100%)',
          background: '#141518',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          padding: '20px 22px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 15,
          animation: 'drawerIn .22s ease',
          boxShadow: '-28px 0 70px -24px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 13px 6px 11px',
              borderRadius: 999,
              background: hexA(def.color, 0.14),
              color: def.color,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Icon name={def.icon} size={16} color={def.color} spin={def.icon === 'spinner' && !reduceMotion} />
            {def.label}
          </span>
          <div style={{ flex: 1 }} />
          <button
            className="icon-btn"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 34,
              width: 34,
              background: '#1f2024',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              color: '#9a9ba0',
              cursor: 'pointer',
            }}
          >
            <Icon name="x" size={18} color="#9a9ba0" />
          </button>
        </div>

        <div style={{ fontSize: 21, fontWeight: 700, color: '#F5F5F5', lineHeight: 1.25, letterSpacing: '-.01em' }}>
          {s.title || s.workspace}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 6,
            fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
            fontSize: 12.5,
            color: '#82838a',
          }}
        >
          <span style={{ color: '#9a9ba0' }}>{s.workspace}</span>
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

        {def.attention && waitLabel && (
          <div
            style={{
              background: hexA(def.color, 0.12),
              border: `1px solid ${hexA(def.color, 0.3)}`,
              borderRadius: 10,
              padding: '11px 14px',
              fontSize: 13,
              color: def.color,
              fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
            }}
          >
            wacht al <b>{waitLabel}</b> — {def.label}
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: '#5f6065', marginBottom: 7, fontWeight: 600 }}>
            laatste bericht
          </div>
          <div
            style={{
              background: '#0F1012',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '13px 14px',
              fontSize: 13.5,
              color: '#c2c3c7',
              lineHeight: 1.55,
            }}
          >
            {s.lastMessage || '—'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Cell label="permission mode" value={s.permissionMode || 'onbekend'} mono />
          <Cell label="tokens · kosten" value={`${fmtTok(s.tokens)} · ${fmtCost(s.cost)}`} />
          <div
            style={{
              background: '#1A1B1E',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '11px 13px',
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, color: s.remote ? '#72C4BF' : '#5f6065', fontWeight: 600 }}>
              {s.remote ? '●' : '○'}
            </span>
            <span style={{ fontSize: 13, color: '#d6d7db' }}>
              {s.remote ? 'remote control actief' : 'lokale sessie (geen remote)'}
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: '#5f6065', marginBottom: 7, fontWeight: 600 }}>
            resume-commando
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#0F1012',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <code
              style={{
                flex: 1,
                fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
                fontSize: 12,
                color: '#a9d5d2',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {s.resumeCmd}
            </code>
            <button
              className="icon-btn"
              onClick={onCopyResume}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                background: '#232427',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7,
                color: '#c2c3c7',
                cursor: 'pointer',
                fontSize: 11.5,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <Icon name="copy" size={14} color="#c2c3c7" /> kopieer
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 2 }}>
          <button
            className="primary-btn"
            onClick={onOpenVSCode}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              height: 46,
              background: ACCENT,
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Icon name="code" size={15} color="#fff" /> open VS Code window
          </button>
          <button
            className="ghost-btn"
            onClick={onOpenClaude}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              height: 42,
              background: 'transparent',
              color: '#d6d7db',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Icon name="external" size={15} color="#d6d7db" /> open in claude.ai/code
          </button>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ background: '#1A1B1E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '11px 13px' }}>
      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', color: '#5f6065', marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: '#d6d7db',
          fontFamily: mono ? 'ui-monospace,Menlo,monospace' : undefined,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}
