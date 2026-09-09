import { http, HttpResponse } from 'msw';
import { config } from '@/config';
import { mockCredentials } from '../fixtures/users';
import { apiError, delay, requireAuth } from '../helpers';

const base = config.apiBaseUrl;

export const authHandlers = [
  http.post(`${base}/auth/login`, async ({ request }) => {
    await delay();
    const body = (await request.json()) as { email?: string; password?: string };
    const match = mockCredentials.find(
      (c) => c.email === body.email?.trim().toLowerCase() && c.password === body.password,
    );
    if (!match) {
      return apiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
    }
    return HttpResponse.json({
      token: `mock.${match.user.id}.${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: match.user,
    });
  }),

  http.post(`${base}/auth/logout`, async () => {
    await delay(120);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${base}/auth/me`, async ({ request }) => {
    await delay(150);
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const cred = mockCredentials.find((c) => c.user.id === auth.userId);
    if (!cred) return apiError(401, 'UNAUTHORIZED', 'Unknown user.');
    return HttpResponse.json({ user: cred.user });
  }),
];
