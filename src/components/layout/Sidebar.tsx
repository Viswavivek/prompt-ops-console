import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Workflow, FileText, PlayCircle, Search } from 'lucide-react';
import { paths } from '@/routes/paths';
import { cn } from '@/lib/cn';

const nav = [
  { to: paths.dashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: paths.workflows, label: 'Workflows', icon: Workflow, end: false },
  { to: paths.prompts, label: 'Prompts', icon: FileText, end: false },
  { to: paths.executions, label: 'Executions', icon: PlayCircle, end: false },
  { to: paths.search, label: 'Search', icon: Search, end: false },
];

export function Sidebar() {
  return (
    <aside className="flex w-14 shrink-0 flex-col border-r border-border bg-surface lg:w-56">
      <div className="flex h-14 items-center gap-2 border-b border-border px-3 lg:px-4">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand text-brand-fg">
          <FileText className="h-4 w-4" />
        </div>
        <span className="hidden text-sm font-semibold text-content lg:inline">Prompt Ops</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand/10 text-brand'
                  : 'text-content-muted hover:bg-surface-muted hover:text-content',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="hidden border-t border-border p-3 text-[11px] text-content-subtle lg:block">
        v0.1.0 · scaffold
      </div>
    </aside>
  );
}
