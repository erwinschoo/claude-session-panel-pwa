import { useEffect, useMemo, useRef, useState } from 'react';
import type { Session, Status } from './types';
import { STATUS } from './status';
import { useSessions } from './useSessions';
import { apiUrl, probe, getToken, getBase, hasExplicitBase, clearConnection } from './connection';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { SessionCard } from './components/SessionCard';
import { SessionDrawer } from './components/SessionDrawer';
import { SettingsDrawer, type SettingKey, type Settings } from './components/SettingsDrawer';
import { ConnectScreen } from './components/ConnectScreen';
import { Toasts, type ToastItem } from './components/Toasts';
import { DisconnectedBanner, EmptyState, SkeletonGrid } from './components/States';

const DEFAULT_SETTINGS: Settings = { notifications: true, sound: true, preview: true, focusOnly: false };

function loadSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('panel_settings') || '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const EMPTY_COUNTS: Record<Status, number> = {
  waiting_permission: 0,
  error: 0,
  waiting_input: 0,
  working: 0,
  ready: 0,
  offline: 0,
};

export default function App() {
  const [phase, setPhase] = useState<'checking' | 'connect' | 'ready'>('checking');
  const { sessions, connected, everConnected, reconnectNow } = useSessions(phase === 'ready');
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<Status | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);
  const prevStatus = useRef<Map<string, Status>>(new Map());
  const audioRef = useRef<AudioContext | null>(null);
  const reduceMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  );

  // klok / wachttimers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // bepaal bij opstart of we al een (werkende) host hebben, anders verbind-scherm
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (hasExplicitBase()) {
        if (!cancelled) setPhase('ready');
        return;
      }
      const res = await probe('', getToken()); // same-origin (host serveert de PWA zelf?)
      if (!cancelled) setPhase(res === 'ok' ? 'ready' : 'connect');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function changeHost() {
    clearConnection();
    setSettingsOpen(false);
    setPhase('connect');
  }

  useEffect(() => {
    localStorage.setItem('panel_settings', JSON.stringify(settings));
  }, [settings]);

  // toasts + notificaties bij omslag naar aandacht-status
  useEffect(() => {
    const prev = prevStatus.current;
    for (const s of sessions) {
      const before = prev.get(s.id);
      const def = STATUS[s.status];
      if (before && before !== s.status && def.attention) {
        notify(s);
      }
      prev.set(s.id, s.status);
    }
    // opruimen van verdwenen sessies
    for (const id of [...prev.keys()]) {
      if (!sessions.find((s) => s.id === id)) prev.delete(id);
    }
    // app-badge met aantal aandacht-sessies
    const attn = sessions.filter((s) => STATUS[s.status].attention).length;
    // @ts-expect-error experimentele API
    if (attn > 0) navigator.setAppBadge?.(attn);
    // @ts-expect-error experimentele API
    else navigator.clearAppBadge?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  function pushToast(t: Omit<ToastItem, 'id'>, ms = 4600) {
    const id = ++toastId.current;
    setToasts((cur) => [...cur, { ...t, id }]);
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), ms);
  }

  function notify(s: Session) {
    if (!settings.notifications) return;
    const def = STATUS[s.status];
    pushToast({ title: s.title || s.workspace, label: def.label, color: def.color, icon: def.icon });
    if (settings.sound) beep();
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`${def.label} · ${s.workspace}`, { body: s.title || s.lastMessage });
      } catch {
        /* ignore */
      }
    }
  }

  function beep() {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ac = (audioRef.current ??= new Ctx());
      if (ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.connect(g);
      g.connect(ac.destination);
      const t = ac.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.frequency.setValueAtTime(660, t);
      o.frequency.setValueAtTime(880, t + 0.13);
      o.start(t);
      o.stop(t + 0.36);
    } catch {
      /* ignore */
    }
  }

  function toggleSetting(k: SettingKey) {
    setSettings((cur) => {
      const next = { ...cur, [k]: !cur[k] };
      if (k === 'notifications' && next.notifications && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      return next;
    });
  }

  async function openVSCode(s: Session) {
    try {
      await fetch(apiUrl(`/api/sessions/${s.id}/focus-window`), { method: 'POST' });
      pushToast({ title: `VS Code geopend · ${s.workspace}`, label: 'actie uitgevoerd', color: '#F0603A', icon: 'terminal' }, 3200);
    } catch {
      pushToast({ title: 'kon VS Code niet openen', label: 'is de companion bereikbaar?', color: '#DC2626', icon: 'alert' }, 3600);
    }
  }

  function copyResume(s: Session) {
    navigator.clipboard?.writeText(s.resumeCmd).catch(() => {});
    pushToast({ title: 'resume-commando gekopieerd', label: s.resumeCmd, color: '#72C4BF', icon: 'copy' }, 3200);
  }

  function openClaude() {
    window.open('https://claude.ai/code', '_blank', 'noopener');
  }

  // afgeleide waarden
  const counts = useMemo(() => {
    const c = { ...EMPTY_COUNTS };
    for (const s of sessions) c[s.status]++;
    return c;
  }, [sessions]);

  const attentionCount = counts.waiting_permission + counts.waiting_input + counts.error;
  const summaryText = `${attentionCount} aandacht · ${counts.working} bezig · ${counts.ready} klaar`;

  const visible = useMemo(() => {
    let v = sessions;
    if (settings.focusOnly) v = v.filter((s) => STATUS[s.status].attention);
    if (filter) v = v.filter((s) => s.status === filter);
    return v;
  }, [sessions, filter, settings.focusOnly]);

  const selected = selectedId ? sessions.find((s) => s.id === selectedId) ?? null : null;

  const showLoading = !everConnected;
  const showEmpty = everConnected && sessions.length === 0;

  if (phase === 'checking') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6C70', fontSize: 14 }}>
        verbinden…
      </div>
    );
  }
  if (phase === 'connect') {
    return (
      <ConnectScreen
        onConnected={() => {
          setPhase('ready');
          reconnectNow();
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', color: '#ECECEC', background: '#0F1012' }}>
      <Header
        attentionCount={attentionCount}
        clock={new Date(now).toLocaleTimeString('nl-NL', { hour12: false })}
        connected={connected}
        onToggleWs={reconnectNow}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {!showLoading && !showEmpty && (
        <FilterBar counts={counts} total={sessions.length} filter={filter} setFilter={setFilter} summaryText={summaryText} />
      )}

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {everConnected && !connected && <DisconnectedBanner onReconnect={reconnectNow} />}

        {showLoading ? (
          <SkeletonGrid />
        ) : showEmpty ? (
          <EmptyState />
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
                gap: 14,
                padding: '18px 20px',
                alignContent: 'start',
                opacity: connected ? 1 : 0.55,
                transition: 'opacity .2s',
              }}
            >
              {visible.map((s) => (
                <SessionCard
                  key={s.id}
                  s={s}
                  now={now}
                  showPreview={settings.preview}
                  reduceMotion={reduceMotion}
                  onOpen={() => setSelectedId(s.id)}
                  onOpenVSCode={() => openVSCode(s)}
                />
              ))}
            </div>
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6B6C70', fontSize: 14 }}>
                geen sessies in dit filter.
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <SessionDrawer
          s={selected}
          now={now}
          reduceMotion={reduceMotion}
          onClose={() => setSelectedId(null)}
          onOpenVSCode={() => openVSCode(selected)}
          onCopyResume={() => copyResume(selected)}
          onOpenClaude={openClaude}
        />
      )}

      {settingsOpen && (
        <SettingsDrawer
          settings={settings}
          onToggle={toggleSetting}
          onClose={() => setSettingsOpen(false)}
          host={getBase() || 'dit device (lokaal)'}
          onChangeHost={changeHost}
        />
      )}

      <Toasts toasts={toasts} onClose={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))} />
    </div>
  );
}
