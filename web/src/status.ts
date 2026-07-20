import type { Status } from './types';
import type { IconName } from './components/Icon';

export interface StatusDef {
  label: string;
  short: string;
  color: string;
  icon: IconName;
  priority: number;
  attention: boolean;
}

// Exact overgenomen uit het ontwerp (Claude Session Panel.dc.html).
export const STATUS: Record<Status, StatusDef> = {
  waiting_permission: { label: 'wacht op permissie', short: 'permissie', color: '#F0603A', icon: 'shield', priority: 0, attention: true },
  error: { label: 'error', short: 'error', color: '#DC2626', icon: 'alert', priority: 1, attention: true },
  waiting_input: { label: 'wacht op input', short: 'input', color: '#F59E0B', icon: 'input', priority: 2, attention: true },
  working: { label: 'bezig', short: 'bezig', color: '#3B82F6', icon: 'spinner', priority: 3, attention: false },
  ready: { label: 'klaar', short: 'klaar', color: '#22C55E', icon: 'check', priority: 4, attention: false },
  offline: { label: 'offline', short: 'offline', color: '#6B7280', icon: 'offline', priority: 5, attention: false },
};

export const PILL_ORDER: Status[] = [
  'waiting_permission',
  'waiting_input',
  'error',
  'working',
  'ready',
  'offline',
];
