import { Icon } from './Icon';

const ACCENT = '#F0603A';

export interface Settings {
  notifications: boolean;
  sound: boolean;
  preview: boolean;
  focusOnly: boolean;
}

export type SettingKey = keyof Settings;

const ROWS: { key: SettingKey; title: string; sub: string }[] = [
  { key: 'notifications', title: 'notificaties', sub: 'melding bij omslag naar wacht-status' },
  { key: 'sound', title: 'geluid', sub: 'korte toon bij aandacht' },
  { key: 'preview', title: 'bericht-preview op kaart', sub: 'toon laatste regel op de kaart' },
  { key: 'focusOnly', title: 'focus-modus', sub: 'toon alleen sessies die aandacht vragen' },
];

export function SettingsDrawer({
  settings,
  onToggle,
  onClose,
}: {
  settings: Settings;
  onToggle: (k: SettingKey) => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 45,
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
          width: 'min(380px,100%)',
          background: '#141518',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          padding: '20px 20px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: 'drawerIn .22s ease',
          boxShadow: '-28px 0 70px -24px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F5F5F5' }}>instellingen</span>
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

        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.08em', color: '#5f6065', fontWeight: 600, marginTop: 4 }}>
          weergave & meldingen
        </div>

        {ROWS.map((row) => {
          const on = settings[row.key];
          return (
            <div
              key={row.key}
              onClick={() => onToggle(row.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                padding: '13px 15px',
                borderRadius: 11,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.06)',
                background: on ? '#1f2024' : '#17181b',
                transition: 'background .15s',
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, color: '#e0e1e5', fontWeight: 600 }}>{row.title}</div>
                <div style={{ fontSize: 11.5, color: '#6B6C70' }}>{row.sub}</div>
              </div>
              <span
                style={{
                  position: 'relative',
                  width: 40,
                  height: 23,
                  borderRadius: 999,
                  flexShrink: 0,
                  transition: 'background .18s',
                  display: 'inline-block',
                  background: on ? ACCENT : '#3a3b40',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    width: 19,
                    height: 19,
                    borderRadius: 999,
                    background: '#fff',
                    transition: 'left .18s',
                    left: on ? 19 : 2,
                  }}
                />
              </span>
            </div>
          );
        })}

        <div style={{ flex: 1 }} />
        <div style={{ textAlign: 'center', fontSize: 11.5, color: '#3d3e42', fontWeight: 600 }}>
          we commit. we deliver.
        </div>
      </div>
    </div>
  );
}
