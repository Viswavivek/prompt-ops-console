import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  badge?: ReactNode;
}

export function Tabs({
  items,
  active,
  onChange,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-border">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            active === item.id
              ? 'border-brand text-brand'
              : 'border-transparent text-content-muted hover:text-content',
          )}
        >
          {item.label}
          {item.badge != null && (
            <span className="rounded-full bg-surface-muted px-1.5 text-xs text-content-muted">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
