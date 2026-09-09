import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { FullScreenLoader } from '@/components/common/FullScreenLoader';

/** Guards a route subtree: unauthenticated users are sent to /login. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isResolving } = useAuth();
  const location = useLocation();

  if (isResolving) return <FullScreenLoader label="Restoring your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}

/** Inverse guard: authenticated users on /login are bounced to the app. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isResolving } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (isResolving) return <FullScreenLoader label="Loading…" />;
  if (isAuthenticated) return <Navigate to={from} replace />;
  return <>{children}</>;
}
