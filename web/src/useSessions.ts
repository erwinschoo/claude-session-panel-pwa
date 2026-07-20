import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from './types';

function token(): string {
  try {
    return localStorage.getItem('panel_token') || '';
  } catch {
    return '';
  }
}

export function wsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const t = token();
  return `${proto}//${location.host}/ws${t ? `?token=${encodeURIComponent(t)}` : ''}`;
}

export function apiUrl(path: string): string {
  const t = token();
  return `${path}${t ? `${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(t)}` : ''}`;
}

export interface UseSessions {
  sessions: Session[];
  connected: boolean;
  everConnected: boolean;
  reconnectNow: () => void;
}

export function useSessions(): UseSessions {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [connected, setConnected] = useState(false);
  const [everConnected, setEverConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const closedRef = useRef(false);

  const connect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        /* ignore */
      }
    }
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      setEverConnected(true);
      retryRef.current = 0;
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'sessions' && Array.isArray(msg.sessions)) setSessions(msg.sessions);
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => {
      setConnected(false);
      if (closedRef.current) return;
      const delay = Math.min(1000 * 2 ** retryRef.current, 8000);
      retryRef.current += 1;
      timerRef.current = window.setTimeout(connect, delay);
    };
    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const reconnectNow = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    retryRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    closedRef.current = false;
    connect();
    return () => {
      closedRef.current = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { sessions, connected, everConnected, reconnectNow };
}
