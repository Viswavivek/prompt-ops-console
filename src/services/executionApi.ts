import { api, longCall } from './http';
import { toQuery } from './params';
import type {
  Id,
  Paginated,
  ExecutionListItem,
  ExecutionListQuery,
  ExecutionDetail,
  TriggerWorkflowRequest,
  TriggerWorkflowResponse,
} from '@/types';

/** Endpoints 10, 12, 23-24 in docs/API_CONTRACTS.md. */
export const executionApi = {
  list: (query?: ExecutionListQuery) =>
    api.get<Paginated<ExecutionListItem>>(`/executions${toQuery(query)}`),

  get: (executionId: Id) => api.get<ExecutionDetail>(`/executions/${executionId}`),

  forWorkflow: (workflowId: Id, query?: Omit<ExecutionListQuery, 'workflowId'>) =>
    api.get<Paginated<ExecutionListItem>>(
      `/workflows/${workflowId}/executions${toQuery(query)}`,
    ),

  trigger: (workflowId: Id, body: TriggerWorkflowRequest) =>
    api.post<TriggerWorkflowResponse>(`/workflows/${workflowId}/execute`, body, longCall),
};
