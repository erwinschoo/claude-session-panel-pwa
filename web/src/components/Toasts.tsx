import { Icon, type IconName } from './Icon';

export interface ToastItem {
  id: number;
  title: string;
  label: string;
  color: string;
  icon: IconName;
}

export function Toasts({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 60,
        maxWidth: 'calc(100vw - 36px)',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            position: 'relative',
            display: 'flex',
            gap: 11,
            alignItems: 'flex-start',
            background: '#1f2024',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 11,
            padding: '12px 12px 12px 15px',
            width: 300,
            boxShadow: '0 12px 32px -12px rgba(0,0,0,0.7)',
            animation: 'toastIn .22s ease',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: t.color }} />
          <span style={{ display: 'flex', flexShrink: 0, marginTop: 1 }}>
            <Icon name={t.icon} size={16} color={t.color} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ECECEC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.title}
            </div>
            <div style={{ fontSize: 11.5, color: '#8a8b90' }}>{t.label}</div>
          </div>
          <button
            className="toast-close"
            onClick={() => onClose(t.id)}
            style={{ background: 'none', border: 'none', color: '#6B6C70', cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}
          >
            <Icon name="x" size={15} color="#6B6C70" />
          </button>
        </div>
      ))}
    </div>
  );
}
