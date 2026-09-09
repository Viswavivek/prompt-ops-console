import type { Id, IsoDateTime, PageQuery } from './api';
import type { TokenUsage } from './token';

export type ExecutionStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'unknown';

export type TriggerType = 'manual' | 'webhook' | 'schedule' | 'api' | 'retry' | string;

export type NodeStatus = 'success' | 'error' | 'skipped' | 'running' | 'unknown';

export interface ExecutionError {
  message: string;
  nodeName?: string;
}

export interface PromptRunRef {
  promptId: Id;
  version: number;
}

export interface ExecutionListItem {
  executionId: Id;
  workflowId: Id;
  n8nWorkflowId?: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: IsoDateTime;
  stoppedAt: IsoDateTime | null;
  durationMs: number | null;
  triggerType: TriggerType;
  mode?: string;
  error: ExecutionError | null;
  tokenUsage: TokenUsage | null;
  promptRef?: PromptRunRef;
}

export interface ExecutionNode {
  name: string;
  type: string;
  status: NodeStatus;
  startedAt?: IsoDateTime;
  finishedAt?: IsoDateTime;
  durationMs?: number;
  items?: {
    input?: unknown;
    output?: unknown;
  };
  error?: ExecutionError | null;
  request?: unknown;
  response?: unknown;
}

export interface TimelineEntry {
  nodeName: string;
  startedAt?: IsoDateTime;
  finishedAt?: IsoDateTime;
  status: NodeStatus;
}

export interface ExecutionDetail extends ExecutionListItem {
  input?: unknown;
  output?: unknown;
  failedNode?: string;
  nodes?: ExecutionNode[];
  timeline?: TimelineEntry[];
}

export interface ExecutionListQuery extends PageQuery {
  workflowId?: Id;
  status?: ExecutionStatus;
  from?: IsoDateTime;
  to?: IsoDateTime;
}

export interface TriggerWorkflowRequest {
  inputs: Record<string, unknown>;
  waitForCompletion?: boolean;
}

export interface TriggerWorkflowResponse {
  executionId: Id;
  status: ExecutionStatus;
}
