import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'right';
}

export interface SortState {
  sort: string;
  order: 'asc' | 'desc';
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  sort,
  onSortChange,
  isRefreshing,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
  isRefreshing?: boolean;
}) {
  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    if (sort?.sort === key) {
      onSortChange({ sort: key, order: sort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ sort: key, order: 'asc' });
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-content-subtle">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn('px-3 py-2 font-medium', col.align === 'right' && 'text-right')}
              >
                {col.sortable && onSortChange ? (
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-content-muted"
                  >
                    {col.header}
                    {sort?.sort === col.key ? (
                      sort.order === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(isRefreshing && 'opacity-60 transition-opacity')}>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-border/60 last:border-0',
                onRowClick && 'cursor-pointer hover:bg-surface-muted',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-3 py-2.5 text-content',
                    col.align === 'right' && 'text-right',
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
