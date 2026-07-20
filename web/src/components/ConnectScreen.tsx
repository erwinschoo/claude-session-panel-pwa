import { useState } from 'react';
import { probe, setConnection, getBase, getToken } from '../connection';
import { Icon } from './Icon';

const ACCENT = '#F0603A';

type Mode = 'choose' | 'remote';

export function ConnectScreen({ onConnected }: { onConnected: () => void }) {
  const [mode, setMode] = useState<Mode>('choose');
  const [base, setBase] = useState(getBase());
  const [token, setToken] = useState(getToken());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function tryHostHere() {
    setBusy(true);
    setError(null);
    const res = await probe('', token);
    setBusy(false);
    if (res === 'ok') {
      setConnection('', token);
      onConnected();
    } else if (res === 'unauthorized') {
      setError('deze host vraagt een token.');
      setMode('remote');
    } else {
      setError('geen companion op dit device gevonden. draait de host-app hier?');
    }
  }

  async function connectRemote(e: React.FormEvent) {
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
      setError('host onbereikbaar — staat de host-app aan, en (buiten huis) Tailscale op beide apparaten?');
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

        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ChoiceButton
              icon="terminal"
              title="host op dit device"
              sub="de companion draait op deze machine"
              onClick={tryHostHere}
              disabled={busy}
            />
            <ChoiceButton
              icon="wifi"
              title="verbind met een host"
              sub="andere PC / laptop via LAN-adres of Tailscale"
              onClick={() => {
                setError(null);
                setMode('remote');
              }}
              disabled={busy}
            />
            <div style={{ fontSize: 12, color: '#6B6C70', lineHeight: 1.5, marginTop: 4 }}>
              tip: scan de QR-code uit de host-console met je telefoon — die vult adres + token
              automatisch in.
            </div>
          </div>
        )}

        {mode === 'remote' && (
          <form onSubmit={connectRemote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            <button type="submit" className="primary-btn" disabled={busy} style={primaryStyle}>
              {busy ? 'verbinden…' : 'verbind'}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setError(null);
                setMode('choose');
              }}
              style={ghostStyle}
            >
              terug
            </button>
          </form>
        )}

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 13px',
              background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.32)',
              borderRadius: 10,
              fontSize: 13,
              color: '#F0A9A9',
            }}
          >
            <Icon name="alert" size={16} color="#DC2626" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function ChoiceButton({
  icon,
  title,
  sub,
  onClick,
  disabled,
}: {
  icon: 'terminal' | 'wifi';
  title: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="card"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        padding: '15px 16px',
        background: '#1A1B1E',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        cursor: 'pointer',
        color: '#ECECEC',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'rgba(240,96,58,0.14)',
          color: ACCENT,
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={18} color={ACCENT} />
      </span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#6B6C70' }}>{sub}</div>
      </div>
    </button>
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

const ghostStyle: React.CSSProperties = {
  height: 40,
  background: 'transparent',
  color: '#d6d7db',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
