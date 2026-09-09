/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_HTTP_TIMEOUT_MS?: string;
  readonly VITE_AUTH_MODE?: 'jwt';
  readonly VITE_AUTH_STORAGE?: 'local' | 'memory';
  readonly VITE_USE_MOCKS?: string;
  readonly VITE_AUTO_SYNC_ON_START?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
