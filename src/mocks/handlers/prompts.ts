import { http, HttpResponse } from 'msw';
import { config } from '@/config';
import {
  db,
  versionsForPrompt,
  currentVersion,
  promptListItem,
  createPromptVersion,
} from '../db';
import { actorEmail, apiError, delay, paginate, requireAuth } from '../helpers';

const base = config.apiBaseUrl;

export const promptHandlers = [
  http.get(`${base}/prompts`, async ({ request }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() ?? '';
    const mappedOnly = url.searchParams.get('mappedOnly') === 'true';

    let rows = db.promptMasters.map(promptListItem);
    if (search) {
      rows = rows.filter((p) => {
        if (p.promptName.toLowerCase().includes(search) || p.promptId.includes(search)) return true;
        return versionsForPrompt(p.promptId).some((v) =>
          v.promptComment.toLowerCase().includes(search),
        );
      });
    }
    if (mappedOnly) rows = rows.filter((p) => p.mappedWorkflows.length > 0);
    rows.sort((a, b) => a.promptName.localeCompare(b.promptName));
    return HttpResponse.json(paginate(rows, url));
  }),

  http.get(`${base}/prompts/:id`, async ({ request, params }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const master = db.promptMasters.find((p) => p.promptId === params.id);
    if (!master) return apiError(404, 'NOT_FOUND', 'Prompt not found.');
    return HttpResponse.json({
      ...promptListItem(master),
      currentVersionContent: currentVersion(master.promptId)?.promptComment ?? '',
    });
  }),

  http.get(`${base}/prompts/:id/versions`, async ({ request, params }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const url = new URL(request.url);
    const summaryOnly = url.searchParams.get('fields') === 'summary';
    const versions = versionsForPrompt(String(params.id));
    if (!versions.length && !db.promptMasters.some((p) => p.promptId === params.id)) {
      return apiError(404, 'NOT_FOUND', 'Prompt not found.');
    }
    const top = versions[0]?.version;
    const body = versions.map((v) => ({
      ...v,
      isCurrent: v.version === top,
      ...(summaryOnly ? { promptComment: undefined } : {}),
    }));
    return HttpResponse.json(body);
  }),

  http.get(`${base}/prompts/:id/versions/:version`, async ({ request, params }) => {
    await delay();
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const version = versionsForPrompt(String(params.id)).find(
      (v) => v.version === Number(params.version),
    );
    if (!version) return apiError(404, 'NOT_FOUND', 'Version not found.');
    return HttpResponse.json(version);
  }),

  http.post(`${base}/prompts/:id/versions`, async ({ request, params }) => {
    await delay(500);
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const promptId = String(params.id);
    const master = db.promptMasters.find((p) => p.promptId === promptId);
    if (!master) return apiError(404, 'NOT_FOUND', 'Prompt not found.');

    const body = (await request.json()) as { promptComment?: string; baseVersion?: number };
    if (!body.promptComment || !body.promptComment.trim()) {
      return apiError(400, 'VALIDATION_ERROR', 'Prompt content cannot be empty.', {
        field: 'promptComment',
      });
    }
    const latest = currentVersion(promptId)?.version ?? 0;
    if (body.baseVersion != null && body.baseVersion !== latest) {
      return apiError(
        409,
        'STALE_VERSION',
        `This prompt has moved on to version ${latest}. Reload before saving.`,
        { latest },
      );
    }
    const created = createPromptVersion(promptId, body.promptComment, actorEmail(auth.userId));
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post(
    `${base}/prompts/:id/versions/:version/restore`,
    async ({ request, params }) => {
      await delay(500);
      const auth = requireAuth(request);
      if (auth instanceof Response) return auth;
      const promptId = String(params.id);
      const source = versionsForPrompt(promptId).find(
        (v) => v.version === Number(params.version),
      );
      if (!source) return apiError(404, 'NOT_FOUND', 'Version not found.');
      const created = createPromptVersion(
        promptId,
        source.promptComment,
        actorEmail(auth.userId),
      );
      return HttpResponse.json(created, { status: 201 });
    },
  ),
];
