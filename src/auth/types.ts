import type { LoginRequest, Session, User } from '@/types';

/**
 * The auth mechanism lives behind this interface so it can be swapped
 * (JWT today; cookie/session/OIDC later) without touching UI code.
 */
export interface AuthAdapter {
  readonly mode: string;

  /** Exchange credentials for a session. Throws ApiError on failure. */
  login(credentials: LoginRequest): Promise<Session>;

  /** Best-effort server-side sign-out. Must not throw. */
  logout(session: Session | null): Promise<void>;

  /** Rehydrate a session from persisted state on app start. Returns null if none/invalid. */
  restore(): Promise<Session | null>;

  /** Persist (or clear, when null) the session between reloads. */
  persist(session: Session | null): void;

  /** Current bearer token for outgoing requests, or null. */
  getToken(): string | null;

  /** Optional silent token refresh; return null if unsupported or failed. */
  refresh?(session: Session): Promise<Session | null>;

  /** Optionally re-fetch the user profile for a live token. */
  fetchUser?(): Promise<User>;
}
