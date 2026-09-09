import type { Id, IsoDateTime } from './api';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export type TokenRange = 'today' | 'week' | 'month' | 'custom';

export interface TokenUsageDailyPoint {
  date: string; // YYYY-MM-DD
  input: number;
  output: number;
  total: number;
}

/**
 * `available: false` (or a 404) means the backend has no token data yet.
 * The UI must render an explicit "not available" state — never zeros (docs/ASSUMPTIONS.md D1).
 */
export interface TokenUsageSummary {
  available: boolean;
  range: TokenRange;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  byDay?: TokenUsageDailyPoint[];
}

export interface TokenUsageBreakdownItem {
  executionId?: Id;
  promptId?: Id;
  version?: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  at?: IsoDateTime;
}

export interface TokenUsageBreakdown {
  available: boolean;
  items: TokenUsageBreakdownItem[];
}

export interface TokenUsageQuery {
  workflowId?: Id;
  promptId?: Id;
  executionId?: Id;
}
