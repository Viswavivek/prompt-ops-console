import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from './authStore';

/** Kicks off session restore on mount. Render once, near the app root. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}
