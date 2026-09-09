import { useState, type FormEvent } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { useAuth } from '@/auth';
import { config } from '@/config';

export function LoginPage() {
  const { login, loggingIn, loginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="flex h-full items-center justify-center bg-surface-muted p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-fg">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-content">Prompt Ops Console</h1>
            <p className="text-xs text-content-subtle">Sign in to continue</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-content">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-content outline-none focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-content">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-content outline-none focus:border-brand"
            />
          </div>

          {loginError && (
            <p
              role="alert"
              className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-fg disabled:opacity-60"
          >
            {loggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
            {loggingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {config.mocks.enabled && (
          <p className="mt-5 rounded-md bg-surface-muted px-3 py-2 text-xs text-content-muted">
            Mock mode — use <code className="font-mono">demo@promptops.dev</code> /{' '}
            <code className="font-mono">demo1234</code>
          </p>
        )}
      </div>
    </div>
  );
}
