import fs from 'node:fs';
import type { Status } from './types.js';

/** Per-transcript leesstatus: onthoudt byte-offset + cumulatieve afgeleiden. */
export interface TranscriptState {
  offset: number;
  tokens: number;
  cost: number;
  model: string;
  effort: string;
  branch: string;
  lastMessage: string;
  fileStatus: Status; // status puur afgeleid uit de transcript
  lastActivity: number; // epoch ms van laatste regel
}

export function initTranscriptState(): TranscriptState {
  return {
    offset: 0,
    tokens: 0,
    cost: 0,
    model: '',
    effort: '',
    branch: '',
    lastMessage: '',
    fileStatus: 'working',
    lastActivity: 0,
  };
}

// Ruwe prijs-schatting per 1M tokens (USD). Bewust benaderend.
const RATES: Record<string, { in: number; out: number }> = {
  opus: { in: 15, out: 75 },
  sonnet: { in: 3, out: 15 },
  haiku: { in: 0.8, out: 4 },
};

function shortModel(model: string): string {
  const m = model.toLowerCase();
  if (m.includes('opus')) return 'opus';
  if (m.includes('sonnet')) return 'sonnet';
  if (m.includes('haiku')) return 'haiku';
  if (m.includes('fable')) return 'fable';
  return model || '';
}

function textFromContent(content: any): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join(' ')
    .trim();
}

function contentHasToolResult(content: any): boolean {
  return Array.isArray(content) && content.some((b) => b && b.type === 'tool_result');
}

function contentIsHumanText(content: any): boolean {
  if (typeof content === 'string') return content.trim().length > 0;
  return Array.isArray(content) && content.some((b) => b && b.type === 'text');
}

/**
 * Leest nieuwe bytes van het transcript sinds de vorige offset en werkt de
 * afgeleide velden (status/titel/tokens/…) bij. Muteert en retourneert `state`.
 */
export function updateTranscript(filePath: string, state: TranscriptState): TranscriptState {
  let size: number;
  try {
    size = fs.statSync(filePath).size;
  } catch {
    return state; // bestand (nog) weg
  }

  // Bestand geroteerd / ingekort -> opnieuw beginnen.
  if (size < state.offset) {
    state.offset = 0;
    state.tokens = 0;
    state.cost = 0;
  }
  if (size === state.offset) return state;

  let buf: Buffer;
  const fd = fs.openSync(filePath, 'r');
  try {
    const len = size - state.offset;
    buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, state.offset);
  } finally {
    fs.closeSync(fd);
  }

  const lastNl = buf.lastIndexOf(0x0a);
  if (lastNl === -1) return state; // nog geen complete regel
  const complete = buf.subarray(0, lastNl + 1);
  state.offset += complete.length;

  const lines = complete.toString('utf8').split('\n');
  // Wat is de laatste "betekenisvolle" regel (user/assistant)?
  let lastKind: 'assistant' | 'user' | null = null;
  let lastStopReason: string | null = null;
  let lastUserIsToolResult = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    let ev: any;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }

    if (typeof ev.gitBranch === 'string' && ev.gitBranch) state.branch = ev.gitBranch;
    if (typeof ev.timestamp === 'string') {
      const t = Date.parse(ev.timestamp);
      if (!Number.isNaN(t)) state.lastActivity = t;
    }

    switch (ev.type) {
      case 'ai-title':
        // titel wordt in de registry gebruikt; hier niet nodig, maar sla op via lastMessage niet.
        break;
      case 'assistant': {
        const msg = ev.message ?? {};
        if (msg.model) state.model = shortModel(msg.model);
        const lvl = ev.effort?.level ?? ev.effort;
        if (typeof lvl === 'string') state.effort = lvl;
        const text = textFromContent(msg.content);
        if (text) state.lastMessage = text.slice(0, 240);
        const u = msg.usage;
        if (u) {
          const input = u.input_tokens ?? 0;
          const output = u.output_tokens ?? 0;
          // Headline-tokens & kosten = nieuwe (niet-gecachte) tokens. cache_read wordt elke
          // turn opnieuw meegestuurd; cumulatief meetellen laat de cijfers exploderen.
          // Dit is bewust een consistente ondergrens-schatting (excl. cache).
          state.tokens += input + output;
          const rate = RATES[state.model] ?? RATES.sonnet;
          state.cost += (input * rate.in + output * rate.out) / 1_000_000;
        }
        lastKind = 'assistant';
        lastStopReason = msg.stop_reason ?? null;
        break;
      }
      case 'user': {
        const msg = ev.message ?? {};
        lastUserIsToolResult = contentHasToolResult(msg.content) || !!ev.toolUseResult;
        lastKind = 'user';
        break;
      }
      default:
        break;
    }
  }

  state.fileStatus = classify(lastKind, lastStopReason, lastUserIsToolResult, state.lastMessage);
  return state;
}

function classify(
  lastKind: 'assistant' | 'user' | null,
  stopReason: string | null,
  userIsToolResult: boolean,
  lastMessage: string,
): Status {
  if (lastKind === 'assistant') {
    if (stopReason === 'tool_use') return 'working';
    if (stopReason === 'end_turn' || stopReason === 'stop_sequence' || stopReason === null) {
      // Vraag aan de gebruiker? -> aandacht. Anders afgerond.
      return /\?\s*$/.test(lastMessage.trim()) ? 'waiting_input' : 'ready';
    }
    return 'ready';
  }
  if (lastKind === 'user') {
    // tool_result of verse human-prompt: model is (weer) aan het werk.
    return 'working';
  }
  return 'working';
}

/** Leest de laatste ai-title uit de staart van een transcript (kleine read). */
export function readAiTitle(filePath: string): string | null {
  let size: number;
  try {
    size = fs.statSync(filePath).size;
  } catch {
    return null;
  }
  const start = Math.max(0, size - 65536);
  const len = size - start;
  const buf = Buffer.alloc(len);
  const fd = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fd, buf, 0, len, start);
  } finally {
    fs.closeSync(fd);
  }
  const lines = buf.toString('utf8').split('\n');
  let title: string | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || !line.includes('ai-title')) continue;
    try {
      const ev = JSON.parse(line);
      if (ev.type === 'ai-title' && typeof ev.aiTitle === 'string') title = ev.aiTitle;
    } catch {
      /* ignore */
    }
  }
  return title;
}
