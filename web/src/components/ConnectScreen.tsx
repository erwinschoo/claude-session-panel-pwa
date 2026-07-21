import { useState } from 'react';
import { probe, setConnection, getBase, getToken } from '../connection';
import { Icon } from './Icon';

const ACCENT = '#F0603A';

export function ConnectScreen({ onConnected }: { onConnected: () => void }) {
  const [base, setBase] = useState(getBase());
  const [token, setToken] = useState(getToken());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    if (!base.trim()) {
      setError('vul het host-adres in.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await probe(base, token);
    setBusy(false);
    if (res === 'ok') {
      setConnection(base, token);
      onConnected();
    } else if (res === 'unauthorized') {
      setError('token ontbreekt of is onjuist.');
    } else {
      setError('host onbereikbaar. tip: gebruik https via Tailscale (een https-pagina mag geen http-host bereiken), en check of de host-app draait.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 'min(420px,100%)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <img src={`${import.meta.env.BASE_URL}icons/dee.svg`} alt="" height={28} width={28} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#F5F5F5' }}>session panel</span>
            <span style={{ fontSize: 11, color: '#6B6C70' }}>verbind met je host</span>
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#8a8b90', lineHeight: 1.55 }}>
          Start de <b style={{ color: '#c2c3c7' }}>host-app</b> op je laptop en <b style={{ color: '#c2c3c7' }}>scan
          de QR</b> uit de console — dan wordt alles hieronder automatisch ingevuld. Of vul het handmatig in:
        </div>

        <form onSubmit={connect} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="host-adres">
            <input
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="http://192.168.1.20:4317  of  https://laptop.tailnet.ts.net"
              style={inputStyle}
              autoFocus
            />
          </Field>
          <Field label="token (indien nodig)">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="uit de host-console"
              style={inputStyle}
            />
          </Field>
          <button type="submit" disabled={busy} style={primaryStyle}>
            {busy ? 'verbinden…' : 'verbind'}
          </button>
        </form>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '11px 13px',
              background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.32)',
              borderRadius: 10,
              fontSize: 13,
              color: '#F0A9A9',
              lineHeight: 1.5,
            }}
          >
            <span style={{ flexShrink: 0, marginTop: 1 }}>
              <Icon name="alert" size={16} color="#DC2626" />
            </span>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: '#5f6065', fontWeight: 600 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  background: '#0F1012',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 9,
  color: '#ECECEC',
  fontSize: 13,
  fontFamily: "ui-monospace,'SF Mono',Menlo,monospace",
};

const primaryStyle: React.CSSProperties = {
  height: 44,
  background: ACCENT,
  color: '#fff',
  border: 'none',
  borderRadius: 9,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};
