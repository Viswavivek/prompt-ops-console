import { http, HttpResponse } from 'msw';
import { config } from '@/config';
import { db } from '../db';
import { delay, requireAuth } from '../helpers';

const base = config.apiBaseUrl;

export const syncHandlers = [
  http.post(`${base}/workflows/sync`, async ({ request }) => {
    await delay(300);
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    db.sync = { ...db.sync, status: 'running', errors: [] };
    const syncId = `sync_${Date.now()}`;

    setTimeout(() => {
      db.sync = {
        status: 'success',
        lastSyncAt: new Date().toISOString(),
        workflowCount: db.workflows.length,
        added: 0,
        updated: 2,
        removed: 0,
        errors: [],
        durationMs: 2600,
      };
    }, 2600);

    return HttpResponse.json({ syncId, status: 'running' }, { status: 202 });
  }),

  http.get(`${base}/workflows/sync/status`, async ({ request }) => {
    await delay(120);
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    return HttpResponse.json(db.sync);
  }),
];
