import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { workflowApi, isApiError } from '@/services';
import { qk } from '@/lib/queryClient';
import type { Id, WorkflowListQuery } from '@/types';

export function useWorkflowList(query: WorkflowListQuery) {
  return useQuery({
    queryKey: qk.workflows.list(query),
    queryFn: () => workflowApi.list(query),
    placeholderData: (prev) => prev,
  });
}

export function useWorkflow(workflowId: Id | undefined) {
  return useQuery({
    queryKey: qk.workflows.detail(workflowId ?? ''),
    queryFn: () => workflowApi.get(workflowId!),
    enabled: !!workflowId,
  });
}

export function useWorkflowTasks(workflowId: Id | undefined) {
  return useQuery({
    queryKey: qk.workflows.tasks(workflowId ?? ''),
    queryFn: () => workflowApi.tasks(workflowId!),
    enabled: !!workflowId,
  });
}

/**
 * Resolves the prompt mapped to a workflow.
 * A 404 NO_PROMPT_MAPPED is an expected "no mapping" state, not an error —
 * callers distinguish it via `isUnmapped`.
 */
export function useWorkflowPrompt(workflowId: Id | undefined) {
  const q = useQuery({
    queryKey: qk.workflows.prompt(workflowId ?? ''),
    queryFn: () => workflowApi.prompt(workflowId!),
    enabled: !!workflowId,
    retry: false,
  });

  const isUnmapped = isApiError(q.error) && q.error.code === 'NO_PROMPT_MAPPED';
  return { ...q, isUnmapped };
}

export function useSyncStatus(options?: { poll?: boolean }) {
  return useQuery({
    queryKey: qk.sync.status,
    queryFn: () => workflowApi.syncStatus(),
    refetchInterval: (query) =>
      options?.poll && query.state.data?.status === 'running' ? 2000 : false,
  });
}

export function useSyncWorkflows() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => workflowApi.startSync(),
    onSuccess: async () => {
      toast.success('Sync started');
      await qc.invalidateQueries({ queryKey: qk.sync.status });
      // Give the mock job a moment, then refresh the list.
      setTimeout(() => {
        void qc.invalidateQueries({ queryKey: qk.workflows.all });
        void qc.invalidateQueries({ queryKey: qk.sync.status });
      }, 3000);
    },
    onError: (err) => {
      toast.error(isApiError(err) ? err.message : 'Sync failed to start');
    },
  });
}
