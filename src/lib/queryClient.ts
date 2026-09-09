import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/services';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry auth / not-found / validation errors.
        if (isApiError(error)) {
          if (['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'VALIDATION_ERROR'].includes(error.code)) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

/** Central query-key factory so keys stay consistent across hooks. */
export const qk = {
  auth: { me: ['auth', 'me'] as const },
  workflows: {
    all: ['workflows'] as const,
    list: (query?: unknown) => ['workflows', 'list', query] as const,
    detail: (id: string) => ['workflows', 'detail', id] as const,
    tasks: (id: string) => ['workflows', id, 'tasks'] as const,
    prompt: (id: string) => ['workflows', id, 'prompt'] as const,
    executionInputs: (id: string) => ['workflows', id, 'execution-inputs'] as const,
  },
  prompts: {
    all: ['prompts'] as const,
    list: (query?: unknown) => ['prompts', 'list', query] as const,
    detail: (id: string) => ['prompts', 'detail', id] as const,
    versions: (id: string) => ['prompts', id, 'versions'] as const,
    version: (id: string, v: number) => ['prompts', id, 'versions', v] as const,
  },
  executions: {
    all: ['executions'] as const,
    list: (query?: unknown) => ['executions', 'list', query] as const,
    detail: (id: string) => ['executions', 'detail', id] as const,
  },
  search: (q: string, type?: string) => ['search', type ?? 'all', q] as const,
  tokenUsage: {
    summary: (range: string) => ['token-usage', 'summary', range] as const,
    breakdown: (query: unknown) => ['token-usage', 'breakdown', query] as const,
  },
  sync: { status: ['sync', 'status'] as const },
};
