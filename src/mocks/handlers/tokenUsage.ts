import { http, HttpResponse } from 'msw';
import { config } from '@/config';
import { db } from '../db';
import { delay, requireAuth } from '../helpers';
import { mockTokenSummary, MOCK_TOKENS_AVAILABLE } from '../fixtures/tokenUsage';
import type { TokenRange } from '@/types';

const base = config.apiBaseUrl;

export const tokenHandlers = [
  http.get(`${base}/token-usage/summary`, async ({ request }) => {
    await delay(200);
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const range = (new URL(request.url).searchParams.get('range') ?? 'week') as TokenRange;
    return HttpResponse.json(mockTokenSummary(range));
  }),

  http.get(`${base}/token-usage`, async ({ request }) => {
    await delay(200);
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    if (!MOCK_TOKENS_AVAILABLE) {
      return HttpResponse.json({ available: false, items: [] });
    }
    const url = new URL(request.url);
    const workflowId = url.searchParams.get('workflowId');
    const promptId = url.searchParams.get('promptId');
    const executionId = url.searchParams.get('executionId');

    const items = db.executions
      .filter((e) => e.tokenUsage)
      .filter((e) => !workflowId || e.workflowId === workflowId)
      .filter((e) => !executionId || e.executionId === executionId)
      .filter((e) => !promptId || e.promptRef?.promptId === promptId)
      .map((e) => ({
        executionId: e.executionId,
        promptId: e.promptRef?.promptId,
        version: e.promptRef?.version,
        inputTokens: e.tokenUsage!.inputTokens,
        outputTokens: e.tokenUsage!.outputTokens,
        totalTokens: e.tokenUsage!.totalTokens,
        at: e.startedAt,
      }));

    return HttpResponse.json({ available: true, items });
  }),
];
