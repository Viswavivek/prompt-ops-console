import type { TokenUsageSummary, TokenUsageDailyPoint } from '@/types';

/**
 * Flip to `false` to exercise the "token data not available" UI path (docs/ASSUMPTIONS.md D1).
 */
export const MOCK_TOKENS_AVAILABLE = true;

const byDay: TokenUsageDailyPoint[] = [
  { date: '2026-08-31', input: 210_000, output: 96_000, total: 306_000 },
  { date: '2026-09-01', input: 244_000, output: 121_000, total: 365_000 },
  { date: '2026-09-02', input: 198_000, output: 88_000, total: 286_000 },
  { date: '2026-09-03', input: 305_000, output: 142_000, total: 447_000 },
  { date: '2026-09-04', input: 276_000, output: 130_000, total: 406_000 },
  { date: '2026-09-05', input: 312_000, output: 151_000, total: 463_000 },
  { date: '2026-09-06', input: 88_000, output: 37_430, total: 125_430 },
];

const sum = (points: TokenUsageDailyPoint[]) =>
  points.reduce(
    (acc, p) => ({
      inputTokens: acc.inputTokens + p.input,
      outputTokens: acc.outputTokens + p.output,
      totalTokens: acc.totalTokens + p.total,
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
  );

export function mockTokenSummary(range: 'today' | 'week' | 'month' | 'custom'): TokenUsageSummary {
  if (!MOCK_TOKENS_AVAILABLE) {
    return { available: false, range, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }
  const points =
    range === 'today' ? byDay.slice(-1) : range === 'week' ? byDay.slice(-7) : byDay;
  const totals = sum(points);
  return { available: true, range, ...totals, byDay: points };
}
