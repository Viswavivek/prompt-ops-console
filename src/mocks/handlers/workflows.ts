import { http, HttpResponse } from 'msw';
import { config } from '@/config';
import { db, currentVersion } from '../db';
import { apiError, delay, paginate, requireAuth } from '../helpers';

const base = config.apiBaseUrl;

export const workflowHandlers = [
  http.get(`${base}/workflows`, async ({ request }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status') ?? 'all';
    const hasPrompt = url.searchParams.get('hasPrompt');
    const sort = url.searchParams.get('sort') ?? 'name';
    const order = url.searchParams.get('order') ?? 'asc';

    let rows = [...db.workflows];
    if (search) {
      rows = rows.filter(
        (w) =>
          w.workflowName.toLowerCase().includes(search) ||
          w.workflowId.includes(search) ||
          (w.mappedPrompt?.promptName.toLowerCase().includes(search) ?? false),
      );
    }
    if (status === 'active') rows = rows.filter((w) => w.active);
    if (status === 'inactive') rows = rows.filter((w) => !w.active);
    if (hasPrompt === 'true') rows = rows.filter((w) => w.mappedPrompt);
    if (hasPrompt === 'false') rows = rows.filter((w) => !w.mappedPrompt);

    rows.sort((a, b) => {
      const dir = order === 'desc' ? -1 : 1;
      if (sort === 'updatedAt') return dir * ((a.updatedAt ?? '').localeCompare(b.updatedAt ?? ''));
      if (sort === 'createdAt') return dir * a.createdAt.localeCompare(b.createdAt);
      return dir * a.workflowName.localeCompare(b.workflowName);
    });

    return HttpResponse.json(paginate(rows, url));
  }),

  http.get(`${base}/workflows/:id`, async ({ request, params }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const wf = db.workflows.find((w) => w.workflowId === params.id);
    if (!wf) return apiError(404, 'NOT_FOUND', 'Workflow not found.');
    return HttpResponse.json({
      ...wf,
      description: `Automated workflow "${wf.workflowName}" synced from n8n.`,
      taskCount: db.workflowTasks[wf.workflowId]?.length ?? 0,
      n8n: { nodes: db.workflowTasks[wf.workflowId]?.length ?? 0, triggerType: 'webhook' },
    });
  }),

  http.get(`${base}/workflows/:id/tasks`, async ({ request, params }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    return HttpResponse.json(db.workflowTasks[String(params.id)] ?? []);
  }),

  http.get(`${base}/workflows/:id/prompt`, async ({ request, params }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const mapping = db.mappings.find((m) => m.workflowId === params.id);
    if (!mapping) {
      return apiError(404, 'NO_PROMPT_MAPPED', 'This workflow has no prompt mapped.');
    }
    const prompt = db.promptMasters.find((p) => p.promptId === mapping.promptId);
    const version = currentVersion(mapping.promptId);
    if (!prompt || !version) {
      return apiError(404, 'NOT_FOUND', 'Mapped prompt is missing.');
    }
    return HttpResponse.json({
      mapping: {
        promptWorkflowId: mapping.promptWorkflowId,
        promptId: mapping.promptId,
        workflowId: mapping.workflowId,
        createdAt: mapping.createdAt,
        createdBy: mapping.createdBy,
      },
      prompt,
      currentVersion: version,
    });
  }),

  http.get(`${base}/workflows/:id/execution-inputs`, async ({ request, params }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    // Only some workflows expose a schema; others 404 -> UI shows a JSON editor.
    if (params.id === '1001') {
      return HttpResponse.json({
        fields: [
          { name: 'fileUrl', label: 'Invoice file URL', type: 'string', required: true },
          { name: 'vendorHint', label: 'Vendor hint', type: 'string', required: false },
        ],
      });
    }
    if (params.id === '1005') {
      return HttpResponse.json({
        fields: [
          { name: 'clauseText', label: 'Clause text', type: 'string', required: true },
          {
            name: 'jurisdiction',
            label: 'Jurisdiction',
            type: 'enum',
            required: true,
            options: ['US', 'DE', 'UK'],
            default: 'US',
          },
        ],
      });
    }
    return apiError(404, 'NOT_FOUND', 'No input schema for this workflow.');
  }),

  http.get(`${base}/workflows/:id/executions`, async ({ request, params }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const url = new URL(request.url);
    const rows = db.executions
      .filter((e) => e.workflowId === params.id)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .map(toListItem);
    return HttpResponse.json(paginate(rows, url));
  }),
];

function toListItem(e: (typeof db.executions)[number]) {
  const { input: _i, output: _o, nodes: _n, timeline: _t, failedNode: _f, ...rest } = e;
  return rest;
}
