export type Status =
  | 'waiting_permission'
  | 'error'
  | 'waiting_input'
  | 'working'
  | 'ready'
  | 'offline';

export interface Session {
  id: string;
  pid: number;
  status: Status;
  title: string;
  workspace: string;
  cwd: string;
  branch: string;
  model: string;
  effort: string;
  permissionMode: string;
  lastMessage: string;
  tokens: number;
  cost: number;
  remote: boolean;
  attentionSince: number | null;
  startedAt: number;
  resumeCmd: string;
  hasWindow: boolean;
}
