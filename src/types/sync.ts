import type { IsoDateTime } from './api';

export type SyncStatus = 'idle' | 'running' | 'success' | 'error';

export interface SyncStartResponse {
  syncId: string;
  status: SyncStatus;
}

export interface SyncStatusResponse {
  status: SyncStatus;
  lastSyncAt: IsoDateTime | null;
  workflowCount: number;
  added?: number;
  updated?: number;
  removed?: number;
  errors?: { message: string }[];
  durationMs?: number;
}
