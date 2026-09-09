import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, RefreshCw, Link2 } from 'lucide-react';
import { usePromptList } from '@/hooks/usePrompts';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  PageHeader,
  Card,
  DataTable,
  Pagination,
  Button,
  Input,
  Select,
  Badge,
  CenteredLoading,
  EmptyState,
  ErrorState,
  type Column,
} from '@/components/common';
import { relativeTime, orDash } from '@/lib/format';
import { paths } from '@/routes/paths';
import type { PromptListItem } from '@/types';

export function PromptsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mapped, setMapped] = useState<'all' | 'mapped'>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      mappedOnly: mapped === 'mapped' || undefined,
      page,
      pageSize: 15,
    }),
    [debouncedSearch, mapped, page],
  );

  const { data, isLoading, isFetching, error, refetch } = usePromptList(query);
  const rows = data?.data ?? [];

  const columns: Column<PromptListItem>[] = [
    {
      key: 'name',
      header: 'Prompt',
      cell: (p) => (
        <div>
          <p className="font-medium text-content">{p.promptName}</p>
          <p className="font-mono text-xs text-content-subtle">#{p.promptId}</p>
        </div>
      ),
    },
    {
      key: 'version',
      header: 'Current',
      cell: (p) => <Badge tone="success">v{p.currentVersion}</Badge>,
    },
    {
      key: 'versions',
      header: 'Versions',
      cell: (p) => <span className="text-content-muted">{p.versionCount}</span>,
    },
    {
      key: 'workflows',
      header: 'Mapped workflows',
      cell: (p) =>
        p.mappedWorkflows.length ? (
          <div className="flex flex-wrap gap-1">
            {p.mappedWorkflows.slice(0, 2).map((w) => (
              <Badge key={w.workflowId} tone="brand">
                <Link2 className="h-3 w-3" />
                {w.workflowName}
              </Badge>
            ))}
            {p.mappedWorkflows.length > 2 && (
              <Badge tone="muted">+{p.mappedWorkflows.length - 2}</Badge>
            )}
          </div>
        ) : (
          <span className="text-content-subtle">—</span>
        ),
    },
    {
      key: 'changedBy',
      header: 'Last modified',
      cell: (p) => (
        <span className="text-content-muted">
          {relativeTime(p.changedAt)} · {orDash(p.changedBy)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Prompts"
        description="Prompt bodies and version history are stored in PostgreSQL (n8n_schema) via the backend API."
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-[220px] flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, ID, or content…"
              className="pl-8"
            />
          </div>
          <Select
            value={mapped}
            onChange={(e) => {
              setMapped(e.target.value as typeof mapped);
              setPage(1);
            }}
            className="w-auto"
          >
            <option value="all">All prompts</option>
            <option value="mapped">Mapped to a workflow</option>
          </Select>
        </div>

        {isLoading ? (
          <CenteredLoading label="Loading prompts…" />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No prompts found"
            message={debouncedSearch ? 'Try a different search.' : 'No prompts exist yet.'}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(p) => p.promptId}
              onRowClick={(p) => navigate(paths.prompt(p.promptId))}
              isRefreshing={isFetching}
            />
            {data && <Pagination meta={data.pagination} onPageChange={setPage} />}
          </>
        )}
      </Card>
    </div>
  );
}
