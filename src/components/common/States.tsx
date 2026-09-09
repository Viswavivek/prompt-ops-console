import type { ReactNode } from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { isApiError } from '@/services';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
}: {
  icon?: typeof Inbox;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Icon className="h-8 w-8 text-content-subtle" aria-hidden />
      <p className="text-sm font-medium text-content">{title}</p>
      {message && <p className="max-w-sm text-sm text-content-muted">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = 'Could not load this',
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const message = isApiError(error)
    ? error.message
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.';
  const code = isApiError(error) ? error.code : undefined;

  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-danger" aria-hidden />
      <p className="text-sm font-medium text-content">{title}</p>
      <p className="max-w-md text-sm text-content-muted">{message}</p>
      {code && <p className="font-mono text-xs text-content-subtle">{code}</p>}
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry} className="mt-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
