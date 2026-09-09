import { HttpResponse } from 'msw';
import { mockCredentials } from './fixtures/users';

export const LATENCY_MS = 350;

export const delay = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

export function paginate<T>(items: T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? 25)));
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return {
    data,
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    },
  };
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return HttpResponse.json({ error: { code, message, details } }, { status });
}

/** Very loose bearer check for the mock: token must be `mock.<userId>`. */
export function requireAuth(request: Request): { userId: string } | Response {
  const header = request.headers.get('Authorization') ?? '';
  const match = header.match(/^Bearer\s+mock\.(\d+)/);
  if (!match) return apiError(401, 'UNAUTHORIZED', 'Missing or invalid token.');
  return { userId: match[1]! };
}

export function actorEmail(userId: string): string {
  return mockCredentials.find((c) => c.user.id === userId)?.user.email ?? 'unknown';
}
