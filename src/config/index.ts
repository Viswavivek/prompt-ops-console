/**
 * Central, typed access to environment configuration.
 * Nothing else in the app should read `import.meta.env` directly.
 */

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value === '') return fallback;
  return value === 'true' || value === '1';
}

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

export const config = {
  apiBaseUrl,
  http: {
    timeoutMs: int(import.meta.env.VITE_HTTP_TIMEOUT_MS, 20_000),
    /** Long-running calls (workflow triggers) get a larger budget. */
    longTimeoutMs: int(import.meta.env.VITE_HTTP_TIMEOUT_MS, 20_000) * 3,
  },
  auth: {
    mode: (import.meta.env.VITE_AUTH_MODE ?? 'jwt') as 'jwt',
    storage: (import.meta.env.VITE_AUTH_STORAGE ?? 'local') as 'local' | 'memory',
    /** localStorage key for the persisted token. */
    tokenStorageKey: 'poc.auth.token',
  },
  mocks: {
    enabled: bool(import.meta.env.VITE_USE_MOCKS, false),
  },
  sync: {
    autoOnStart: bool(import.meta.env.VITE_AUTO_SYNC_ON_START, false),
    /** Poll interval while a sync job reports `running`. */
    pollIntervalMs: 2_000,
  },
  search: {
    debounceMs: 300,
    minChars: 2,
  },
} as const;

export type AppConfig = typeof config;
