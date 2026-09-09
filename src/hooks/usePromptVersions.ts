import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { promptVersionApi, isApiError } from '@/services';
import { qk } from '@/lib/queryClient';
import type { Id, CreatePromptVersionRequest, PromptVersion } from '@/types';

export function usePromptVersions(promptId: Id | undefined) {
  return useQuery({
    queryKey: qk.prompts.versions(promptId ?? ''),
    queryFn: () => promptVersionApi.list(promptId!),
    enabled: !!promptId,
  });
}

export function usePromptVersion(promptId: Id | undefined, version: number | undefined) {
  return useQuery({
    queryKey: qk.prompts.version(promptId ?? '', version ?? -1),
    queryFn: () => promptVersionApi.get(promptId!, version!),
    enabled: !!promptId && version != null && version >= 0,
  });
}

function invalidatePrompt(qc: ReturnType<typeof useQueryClient>, promptId: Id) {
  void qc.invalidateQueries({ queryKey: qk.prompts.versions(promptId) });
  void qc.invalidateQueries({ queryKey: qk.prompts.detail(promptId) });
  void qc.invalidateQueries({ queryKey: qk.prompts.all });
  void qc.invalidateQueries({ queryKey: qk.workflows.all });
}

export function useCreatePromptVersion(promptId: Id) {
  const qc = useQueryClient();
  return useMutation<PromptVersion, unknown, CreatePromptVersionRequest>({
    mutationFn: (body) => promptVersionApi.create(promptId, body),
    onSuccess: (created) => {
      invalidatePrompt(qc, promptId);
      toast.success(`Saved as version ${created.version}`);
    },
    onError: (err) => {
      if (isApiError(err) && err.code === 'STALE_VERSION') {
        toast.error(err.message);
      } else if (isApiError(err) && err.code === 'VALIDATION_ERROR') {
        toast.error(err.message);
      } else {
        toast.error(isApiError(err) ? err.message : 'Could not save the prompt');
      }
    },
  });
}

export function useRestorePromptVersion(promptId: Id) {
  const qc = useQueryClient();
  return useMutation<PromptVersion, unknown, number>({
    mutationFn: (version) => promptVersionApi.restore(promptId, version),
    onSuccess: (created, sourceVersion) => {
      invalidatePrompt(qc, promptId);
      toast.success(`Restored v${sourceVersion} as new version ${created.version}`);
    },
    onError: (err) => {
      toast.error(isApiError(err) ? err.message : 'Could not restore that version');
    },
  });
}
