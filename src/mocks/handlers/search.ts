import { http, HttpResponse } from 'msw';
import { config } from '@/config';
import { db, versionsForPrompt } from '../db';
import { delay, requireAuth } from '../helpers';
import type { SearchResult } from '@/types';

const base = config.apiBaseUrl;

function snippet(text: string, term: string): string {
  const i = text.toLowerCase().indexOf(term);
  if (i < 0) return text.slice(0, 80);
  const start = Math.max(0, i - 30);
  return `${start > 0 ? '…' : ''}${text.slice(start, i + term.length + 40)}…`;
}

export const searchHandlers = [
  http.get(`${base}/search`, async ({ request }) => {
    await delay(200);
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const type = url.searchParams.get('type') ?? 'all';
    const limit = Number(url.searchParams.get('limit') ?? 20);
    if (q.length < 2) return HttpResponse.json({ results: [] });

    const results: SearchResult[] = [];

    if (type === 'all' || type === 'workflow') {
      for (const w of db.workflows) {
        if (w.workflowName.toLowerCase().includes(q)) {
          results.push({
            kind: 'workflow',
            workflowId: w.workflowId,
            workflowName: w.workflowName,
            active: w.active,
            match: { field: 'workflowName', snippet: w.workflowName },
          });
        } else if (w.workflowId.includes(q)) {
          results.push({
            kind: 'workflow',
            workflowId: w.workflowId,
            workflowName: w.workflowName,
            active: w.active,
            match: { field: 'workflowId', snippet: w.workflowId },
          });
        }
      }
    }

    if (type === 'all' || type === 'prompt') {
      for (const p of db.promptMasters) {
        const versions = versionsForPrompt(p.promptId);
        if (p.promptName.toLowerCase().includes(q) || p.promptId.includes(q)) {
          results.push({
            kind: 'prompt',
            promptId: p.promptId,
            promptName: p.promptName,
            version: versions[0]?.version,
            match: { field: 'promptName', snippet: p.promptName },
          });
        } else {
          const hit = versions.find((v) => v.promptComment.toLowerCase().includes(q));
          if (hit) {
            results.push({
              kind: 'prompt',
              promptId: p.promptId,
              promptName: p.promptName,
              version: hit.version,
              match: { field: 'promptComment', snippet: snippet(hit.promptComment, q) },
            });
          }
        }
      }
    }

    return HttpResponse.json({ results: results.slice(0, limit) });
  }),
];
