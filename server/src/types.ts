// Statussen komen exact overeen met de STATUS-keys uit het ontwerp (dc.html).
export type Status =
  | 'waiting_permission'
  | 'error'
  | 'waiting_input'
  | 'working'
  | 'ready'
  | 'offline';

/** Genormaliseerd sessie-model dat naar de PWA gaat (geen secrets). */
export interface Session {
  id: string; // sessionId (UUID)
  pid: number;
  status: Status;
  title: string; // ai-title of sessie-naam
  workspace: string; // korte mapnaam van cwd/workspaceFolder
  cwd: string;
  branch: string;
  model: string;
  effort: string;
  permissionMode: string;
  lastMessage: string;
  tokens: number;
  cost: number;
  remote: boolean; // remote-control actief (entrypoint / heuristiek)
  attentionSince: number | null; // epoch ms sinds status aandacht vraagt
  startedAt: number;
  resumeCmd: string;
  hasWindow: boolean; // is er een levende VS Code window voor deze cwd?
}
