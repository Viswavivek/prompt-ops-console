import { useAuthStore } from './authStore';

/** Convenience hook exposing just what components need. */
export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const loginError = useAuthStore((s) => s.loginError);
  const loggingIn = useAuthStore((s) => s.loggingIn);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  return {
    status,
    user,
    loginError,
    loggingIn,
    isAuthenticated: status === 'authenticated',
    isResolving: status === 'idle' || status === 'restoring',
    login,
    logout,
  };
}
