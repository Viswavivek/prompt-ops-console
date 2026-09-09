import { useQuery } from '@tanstack/react-query';
import { promptApi } from '@/services';
import { qk } from '@/lib/queryClient';
import type { Id, PromptListQuery } from '@/types';

export function usePromptList(query: PromptListQuery) {
  return useQuery({
    queryKey: qk.prompts.list(query),
    queryFn: () => promptApi.list(query),
    placeholderData: (prev) => prev,
  });
}

export function usePrompt(promptId: Id | undefined) {
  return useQuery({
    queryKey: qk.prompts.detail(promptId ?? ''),
    queryFn: () => promptApi.get(promptId!),
    enabled: !!promptId,
  });
}
