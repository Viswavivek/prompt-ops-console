import { create } from 'zustand';
import { configureHttpAuth, isApiError } from '@/services';
import type { LoginRequest, Session, User } from '@/types';
import { authAdapter } from './adapter';

export type AuthStatus = 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  /** Set when the last login attempt failed, cleared on the next attempt. */
  loginError: string | null;
  loggingIn: boolean;

  bootstrap: () => Promise<void>;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Called by the HTTP layer on a 401. */
  handleUnauthorized: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  session: null,
  user: null,
  loginError: null,
  loggingIn: false,

  bootstrap: async () => {
    if (get().status !== 'idle') return;
    set({ status: 'restoring' });
    try {
      const session = await authAdapter.restore();
      if (session) {
        set({ status: 'authenticated', session, user: session.user });
      } else {
        set({ status: 'unauthenticated', session: null, user: null });
      }
    } catch {
      // Network hiccup during restore — treat as logged out but don't wipe the token.
      set({ status: 'unauthenticated' });
    }
  },

  login: async (credentials) => {
    set({ loggingIn: true, loginError: null });
    try {
      const session = await authAdapter.login(credentials);
      set({
        status: 'authenticated',
        session,
        user: session.user,
        loggingIn: false,
        loginError: null,
      });
      return true;
    } catch (err) {
      const message =
        isApiError(err) && err.code === 'INVALID_CREDENTIALS'
          ? 'Incorrect email or password.'
          : isApiError(err)
            ? err.message
            : 'Unable to sign in. Please try again.';
      set({ loggingIn: false, loginError: message });
      return false;
    }
  },

  logout: async () => {
    const { session } = get();
    await authAdapter.logout(session);
    set({ status: 'unauthenticated', session: null, user: null, loginError: null });
  },

  handleUnauthorized: () => {
    if (get().status === 'authenticated') {
      authAdapter.persist(null);
      set({ status: 'unauthenticated', session: null, user: null });
    }
  },
}));

/** Wire the store into the HTTP layer once, at module load. */
configureHttpAuth({
  getToken: () => useAuthStore.getState().session?.token ?? authAdapter.getToken(),
  onUnauthorized: () => useAuthStore.getState().handleUnauthorized(),
});
