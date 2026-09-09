import { config } from '@/config';
import { authApi } from '@/services';
import { isApiError } from '@/services';
import type { LoginRequest, Session } from '@/types';
import type { AuthAdapter } from './types';

interface PersistedShape {
  token: string;
  refreshToken?: string;
}

const KEY = config.auth.tokenStorageKey;
const useLocal = config.auth.storage === 'local';

let memoryToken: string | null = null;

function readPersisted(): PersistedShape | null {
  if (!useLocal) return memoryToken ? { token: memoryToken } : null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PersistedShape) : null;
  } catch {
    return null;
  }
}

function writePersisted(value: PersistedShape | null): void {
  memoryToken = value?.token ?? null;
  if (!useLocal) return;
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — fall back to in-memory only */
  }
}

/** JWT bearer-token adapter. */
export const jwtAdapter: AuthAdapter = {
  mode: 'jwt',

  async login(credentials: LoginRequest): Promise<Session> {
    const res = await authApi.login(credentials);
    const session: Session = {
      token: res.token,
      refreshToken: res.refreshToken,
      user: res.user,
    };
    this.persist(session);
    return session;
  },

  async logout(): Promise<void> {
    await authApi.logout();
    this.persist(null);
  },

  async restore(): Promise<Session | null> {
    const persisted = readPersisted();
    if (!persisted?.token) return null;
    memoryToken = persisted.token;
    try {
      const user = await authApi.me();
      return { token: persisted.token, refreshToken: persisted.refreshToken, user };
    } catch (err) {
      if (isApiError(err) && err.code === 'UNAUTHORIZED') {
        this.persist(null);
        return null;
      }
      // Network error on boot: keep the token, let the app retry later.
      throw err;
    }
  },

  persist(session: Session | null): void {
    writePersisted(
      session ? { token: session.token, refreshToken: session.refreshToken } : null,
    );
  },

  getToken(): string | null {
    return memoryToken ?? readPersisted()?.token ?? null;
  },

  async refresh(session: Session): Promise<Session | null> {
    if (!session.refreshToken) return null;
    try {
      const res = await authApi.refresh(session.refreshToken);
      const next: Session = {
        token: res.token,
        refreshToken: res.refreshToken ?? session.refreshToken,
        user: res.user ?? session.user,
      };
      this.persist(next);
      return next;
    } catch {
      return null;
    }
  },

  fetchUser: () => authApi.me(),
};
