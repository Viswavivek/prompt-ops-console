import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { config } from '@/config';
import { normalizeError } from './errors';

/**
 * Auth is injected rather than imported to avoid a circular dependency
 * (authStore -> authApi -> http -> authStore).
 */
type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

export function configureHttpAuth(opts: {
  getToken: TokenGetter;
  onUnauthorized: UnauthorizedHandler;
}): void {
  getToken = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
}

export const http: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.http.timeoutMs,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) {
    cfg.headers.set('Authorization', `Bearer ${token}`);
  }
  return cfg;
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const apiError = normalizeError(error);
    const url: string = error?.config?.url ?? '';
    // Don't bounce the user off the login screen for a failed login attempt.
    const isLoginCall = url.includes('/auth/login');
    if (apiError.code === 'UNAUTHORIZED' && !isLoginCall) {
      onUnauthorized();
    }
    return Promise.reject(apiError);
  },
);

/** Thin typed helpers so service modules never touch the axios instance directly. */
export const api = {
  get: <T>(url: string, cfg?: AxiosRequestConfig) => http.get<T>(url, cfg).then((r) => r.data),
  post: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
    http.post<T>(url, body, cfg).then((r) => r.data),
  put: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
    http.put<T>(url, body, cfg).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
    http.patch<T>(url, body, cfg).then((r) => r.data),
  delete: <T>(url: string, cfg?: AxiosRequestConfig) =>
    http.delete<T>(url, cfg).then((r) => r.data),
};

/** Config for long-running calls (workflow triggers). */
export const longCall: AxiosRequestConfig = { timeout: config.http.longTimeoutMs };
