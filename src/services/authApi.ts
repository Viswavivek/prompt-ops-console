import { api } from './http';
import type { LoginRequest, LoginResponse, User } from '@/types';

/** Endpoints 1-4 in docs/API_CONTRACTS.md. */
export const authApi = {
  login: (body: LoginRequest) => api.post<LoginResponse>('/auth/login', body),

  logout: () => api.post<void>('/auth/logout').catch(() => undefined),

  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.user),

  refresh: (refreshToken: string) =>
    api.post<LoginResponse>('/auth/refresh', { refreshToken }),
};
