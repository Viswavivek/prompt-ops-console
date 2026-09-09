import { api } from './http';
import { toQuery } from './params';
import { isApiError } from './errors';
import type { TokenRange, TokenUsageSummary, TokenUsageBreakdown, TokenUsageQuery } from '@/types';

const UNAVAILABLE_SUMMARY = (range: TokenRange): TokenUsageSummary => ({
  available: false,
  range,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
});

/**
 * Endpoints 26-27 in docs/API_CONTRACTS.md.
 * Token data is optional (docs/ASSUMPTIONS.md D1): a 404 is treated as "not available",
 * NOT as an error. Callers must check `available` and never render zeros as real data.
 */
export const tokenApi = {
  summary: async (params: { range: TokenRange; from?: string; to?: string }) => {
    try {
      return await api.get<TokenUsageSummary>(`/token-usage/summary${toQuery({ ...params })}`);
    } catch (err) {
      if (isApiError(err) && err.code === 'NOT_FOUND') return UNAVAILABLE_SUMMARY(params.range);
      throw err;
    }
  },

  breakdown: async (query: TokenUsageQuery) => {
    try {
      return await api.get<TokenUsageBreakdown>(`/token-usage${toQuery({ ...query })}`);
    } catch (err) {
      if (isApiError(err) && err.code === 'NOT_FOUND') {
        return { available: false, items: [] } satisfies TokenUsageBreakdown;
      }
      throw err;
    }
  },
};
