import { EventEmitter } from 'node:events';
import { isAlive, normalizePath, workspaceName } from './claudeHome.js';
import {
  initTranscriptState,
  updateTranscript,
  readAiTitle,
  type TranscriptState,
} from './jsonlTail.js';
import type { Session, Status } from './types.js';

const ATTENTION: Status[] = ['waiting_permission', 'waiting_input', 'error'];
const isAttention = (s: Status) => ATTENTION.includes(s);

interface SessionMeta {
  pid: number;
  cwd: string;
  name: string;
  startedAt: number;
  entrypoint: string;
}

interface IdeWindow {
  port: number;
  pid: number;
  folders: string[]; // genormaliseerd
}

export class Registry extends EventEmitter {
  private meta = new Map<string, SessionMeta>();
  private pidToSession = new Map<number, string>();
  private transcriptPath = new Map<string, string>();
  private transcriptState = new Map<string, TranscriptState>();
  private aiTitle = new Map<string, string>();
  private tracking = new Map<string, { status: Status; attentionSince: number | null }>();
  private hook = new Map<string, { status: Status; at: number }>();
  private ide: IdeWindow[] = [];
  private rebuildTimer: NodeJS.Timeout | null = null;

  // --- bronnen ---

  upsertSession(sessionId: string, m: SessionMeta): void {
    const prev = this.meta.get(sessionId);
    if (prev && prev.pid !== m.pid) this.pidToSession.delete(prev.pid);
    this.meta.set(sessionId, m);
    this.pidToSession.set(m.pid, sessionId);
    this.scheduleRebuild();
  }

  removeSessionByPid(pid: number): void {
    const sessionId = this.pidToSession.get(pid);
    if (!sessionId) return;
    this.pidToSession.delete(pid);
    // Sessie zelf laten staan als 'offline' zolang transcript bestaat? Nee:
    // sessions/<pid>.json weg = CLI-proces weg -> markeer offline via alive-check.
    this.scheduleRebuild();
  }

  setIdeWindows(windows: IdeWindow[]): void {
    this.ide = windows;
    this.scheduleRebuild();
  }

  setTranscriptPath(sessionId: string, filePath: string): void {
    this.transcriptPath.set(sessionId, filePath);
    if (!this.transcriptState.has(sessionId)) {
      this.transcriptState.set(sessionId, initTranscriptState());
    }
    const t = readAiTitle(filePath);
    if (t) this.aiTitle.set(sessionId, t);
    this.refreshTranscript(sessionId);
  }

  refreshTranscript(sessionId: string): void {
    const fp = this.transcriptPath.get(sessionId);
    if (!fp) return;
    let st = this.transcriptState.get(sessionId);
    if (!st) {
      st = initTranscriptState();
      this.transcriptState.set(sessionId, st);
    }
    updateTranscript(fp, st);
    const t = readAiTitle(fp);
    if (t) this.aiTitle.set(sessionId, t);
    this.scheduleRebuild();
  }

  /** Fase 2: directe status uit een Claude-hook. */
  applyHook(sessionId: string, status: Status): void {
    this.hook.set(sessionId, { status, at: Date.now() });
    this.scheduleRebuild();
  }

  /** Vind sessionId bij een transcript-pad (…/<sessionId>.jsonl). */
  sessionIdForFile(filePath: string): string {
    const base = filePath.replace(/\\/g, '/').split('/').pop() ?? '';
    return base.replace(/\.jsonl$/i, '');
  }

  getSession(sessionId: string): Session | undefined {
    return this.snapshot().find((s) => s.id === sessionId);
  }

  // --- afgeleide snapshot ---

  snapshot(): Session[] {
    const now = Date.now();
    const out: Session[] = [];

    for (const [sessionId, m] of this.meta) {
      const alive = isAlive(m.pid);
      const st = this.transcriptState.get(sessionId);
      const hook = this.hook.get(sessionId);

      let status: Status;
      if (!alive) {
        status = 'offline';
      } else {
        const fileStatus = st?.fileStatus ?? 'working';
        const fileAt = st?.lastActivity ?? 0;
        // Hook wint alleen als hij nieuwer is dan de laatste transcript-activiteit.
        status = hook && hook.at >= fileAt ? hook.status : fileStatus;
      }

      // attention-timing bijhouden
      const track = this.tracking.get(sessionId) ?? { status, attentionSince: null };
      let attentionSince = track.attentionSince;
      if (isAttention(status)) {
        if (!isAttention(track.status) || attentionSince == null) attentionSince = now;
      } else {
        attentionSince = null;
      }
      this.tracking.set(sessionId, { status, attentionSince });

      const cwdNorm = normalizePath(m.cwd);
      const hasWindow = this.ide.some(
        (w) => isAlive(w.pid) && w.folders.includes(cwdNorm),
      );

      out.push({
        id: sessionId,
        pid: m.pid,
        status,
        title: this.aiTitle.get(sessionId) || m.name || workspaceName(m.cwd),
        workspace: workspaceName(m.cwd),
        cwd: m.cwd,
        branch: st?.branch || '',
        model: st?.model || '',
        effort: st?.effort || '',
        permissionMode: '', // gevuld door transcript-hooks in fase 2; leeg = onbekend
        lastMessage: st?.lastMessage || '',
        tokens: st?.tokens ?? 0,
        cost: st?.cost ?? 0,
        remote: m.entrypoint?.includes('remote') ?? false,
        attentionSince,
        startedAt: m.startedAt,
        resumeCmd: `claude --resume ${sessionId}`,
        hasWindow,
      });
    }

    // sorteer op status-prioriteit, dan langst-wachtend
    const PRIORITY: Record<Status, number> = {
      waiting_permission: 0,
      error: 1,
      waiting_input: 2,
      working: 3,
      ready: 4,
      offline: 5,
    };
    out.sort(
      (a, b) =>
        PRIORITY[a.status] - PRIORITY[b.status] ||
        (a.attentionSince ?? 9e15) - (b.attentionSince ?? 9e15) ||
        b.startedAt - a.startedAt,
    );
    return out;
  }

  private scheduleRebuild(): void {
    if (this.rebuildTimer) return;
    this.rebuildTimer = setTimeout(() => {
      this.rebuildTimer = null;
      this.emit('update', this.snapshot());
    }, 120);
  }

  /** Periodieke tick zodat offline-detectie & wacht-timers doorlopen. */
  tick(): void {
    this.emit('update', this.snapshot());
  }
}
