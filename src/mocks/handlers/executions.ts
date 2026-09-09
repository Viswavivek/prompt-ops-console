import { http, HttpResponse } from 'msw';
import { config } from '@/config';
import { db, nextId } from '../db';
import { apiError, delay, paginate, requireAuth } from '../helpers';
import type { ExecutionDetail } from '@/types';

const base = config.apiBaseUrl;

const toListItem = (e: ExecutionDetail) => {
  const { input: _i, output: _o, nodes: _n, timeline: _t, failedNode: _f, ...rest } = e;
  return rest;
};

export const executionHandlers = [
  http.get(`${base}/executions`, async ({ request }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const url = new URL(request.url);
    const workflowId = url.searchParams.get('workflowId');
    const status = url.searchParams.get('status');

    let rows = [...db.executions];
    if (workflowId) rows = rows.filter((e) => e.workflowId === workflowId);
    if (status) rows = rows.filter((e) => e.status === status);
    rows.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return HttpResponse.json(paginate(rows.map(toListItem), url));
  }),

  http.get(`${base}/executions/:id`, async ({ request, params }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const found = db.executions.find((e) => e.executionId === params.id);
    if (!found) return apiError(404, 'NOT_FOUND', 'Execution not found.');
    return HttpResponse.json(found);
  }),

  http.post(`${base}/workflows/:id/execute`, async ({ request, params }) => {
    await delay(700);
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const wf = db.workflows.find((w) => w.workflowId === params.id);
    if (!wf) return apiError(404, 'NOT_FOUND', 'Workflow not found.');

    const body = (await request.json()) as { inputs?: Record<string, unknown> };
    // Workflow 1001 requires fileUrl (mirrors its execution-inputs schema).
    if (params.id === '1001' && !body.inputs?.fileUrl) {
      return apiError(400, 'MISSING_REQUIRED_INPUT', 'Missing required input: fileUrl.', {
        fields: ['fileUrl'],
      });
    }

    const now = new Date().toISOString();
    const execution: ExecutionDetail = {
      executionId: nextId('e_'),
      workflowId: wf.workflowId,
      n8nWorkflowId: wf.n8nWorkflowId,
      workflowName: wf.workflowName,
      status: 'queued',
      startedAt: now,
      stoppedAt: null,
      durationMs: null,
      triggerType: 'manual',
      mode: 'manual',
      error: null,
      tokenUsage: null,
      promptRef: wf.mappedPrompt
        ? { promptId: wf.mappedPrompt.promptId, version: wf.mappedPrompt.currentVersion }
        : undefined,
      input: body.inputs ?? {},
      output: null,
      timeline: [],
      nodes: [],
    };
    db.executions.unshift(execution);

    // Simulate lifecycle: queued -> running -> success.
    setTimeout(() => {
      execution.status = 'running';
    }, 1500);
    setTimeout(() => {
      execution.status = 'success';
      execution.stoppedAt = new Date().toISOString();
      execution.durationMs = 4200;
      execution.output = { ok: true, note: 'Mock run completed.' };
      execution.tokenUsage = { inputTokens: 900, outputTokens: 300, totalTokens: 1200 };
    }, 5000);

    return HttpResponse.json(
      { executionId: execution.executionId, status: execution.status },
      { status: 202 },
    );
  }),
];
