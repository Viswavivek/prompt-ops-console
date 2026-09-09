import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Coins } from 'lucide-react';
import { useAuth } from '@/auth';
import { paths } from '@/routes/paths';

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
      <button
        onClick={() => navigate(paths.search)}
        className="flex h-9 min-w-0 flex-1 max-w-md items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-sm text-content-subtle hover:text-content-muted"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Search workflows and prompts…</span>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <span
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-content-muted"
          title="Token usage (see dashboard)"
        >
          <Coins className="h-3.5 w-3.5" />
          Tokens
        </span>

        <div className="flex items-center gap-2 text-sm">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-brand/15 text-xs font-semibold text-brand">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="hidden text-content-muted sm:inline">{user?.name}</span>
        </div>

        <button
          onClick={() => {
            void logout();
            navigate(paths.login);
          }}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-content-muted hover:bg-surface-muted hover:text-content"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
