import { api } from './http';
import { toQuery } from './params';
import type {
  Id,
  Paginated,
  WorkflowListItem,
  WorkflowListQuery,
  WorkflowDetail,
  WorkflowTask,
  WorkflowPromptMapping,
  ExecutionInputSchema,
  SyncStartResponse,
  SyncStatusResponse,
} from '@/types';

/** Endpoints 5-9, 11, 13-14 in docs/API_CONTRACTS.md. */
export const workflowApi = {
  list: (query?: WorkflowListQuery) =>
    api.get<Paginated<WorkflowListItem>>(`/workflows${toQuery(query)}`),

  get: (workflowId: Id) => api.get<WorkflowDetail>(`/workflows/${workflowId}`),

  tasks: (workflowId: Id) => api.get<WorkflowTask[]>(`/workflows/${workflowId}/tasks`),

  /** Throws ApiError with code NO_PROMPT_MAPPED (404) when unmapped. */
  prompt: (workflowId: Id) =>
    api.get<WorkflowPromptMapping>(`/workflows/${workflowId}/prompt`),

  setPrompt: (workflowId: Id, promptId: Id) =>
    api.post<WorkflowPromptMapping>(`/workflows/${workflowId}/prompt`, { promptId }),

  removePrompt: (workflowId: Id) => api.delete<void>(`/workflows/${workflowId}/prompt`),

  /** May 404 — the UI falls back to a free-form JSON editor. */
  executionInputs: (workflowId: Id) =>
    api.get<ExecutionInputSchema>(`/workflows/${workflowId}/execution-inputs`),

  startSync: () => api.post<SyncStartResponse>('/workflows/sync'),

  syncStatus: () => api.get<SyncStatusResponse>('/workflows/sync/status'),
};
