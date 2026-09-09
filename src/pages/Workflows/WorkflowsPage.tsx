import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search as SearchIcon, Link2, Link2Off } from 'lucide-react';
import { useWorkflowList } from '@/hooks/useWorkflows';
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
  type SortState,
} from '@/components/common';
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge';
import { SyncStatusBar } from '@/components/workflows/SyncStatusBar';
import { relativeTime } from '@/lib/format';
import { paths } from '@/routes/paths';
import type { WorkflowListItem } from '@/types';

export function WorkflowsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [hasPrompt, setHasPrompt] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ sort: 'name', order: 'asc' });

  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status,
      hasPrompt: hasPrompt === 'all' ? undefined : hasPrompt === 'true',
      sort: sort.sort,
      order: sort.order,
      page,
      pageSize: 15,
    }),
    [debouncedSearch, status, hasPrompt, sort, page],
  );

  const { data, isLoading, isFetching, error, refetch } = useWorkflowList(query);

  const columns: Column<WorkflowListItem>[] = [
    {
      key: 'name',
      header: 'Workflow',
      sortable: true,
      cell: (w) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-content">{w.workflowName}</p>
          <p className="font-mono text-xs text-content-subtle">#{w.workflowId}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (w) => <WorkflowStatusBadge active={w.active} /> },
    {
      key: 'prompt',
      header: 'Prompt',
      cell: (w) =>
        w.mappedPrompt ? (
          <Badge tone="brand">
            <Link2 className="h-3 w-3" />
            {w.mappedPrompt.promptName} · v{w.mappedPrompt.currentVersion}
          </Badge>
        ) : (
          <Badge tone="muted">
            <Link2Off className="h-3 w-3" />
            none
          </Badge>
        ),
    },
    {
      key: 'updatedAt',
      header: 'Last updated',
      sortable: true,
      cell: (w) => <span className="text-content-muted">{relativeTime(w.updatedAt)}</span>,
    },
  ];

  const rows = data?.data ?? [];
  const noFilters = !debouncedSearch && status === 'all' && hasPrompt === 'all';

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="n8n workflows synced through the backend API."
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="mb-4">
        <SyncStatusBar />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-[200px] flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or ID…"
              className="pl-8"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
            className="w-auto"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Select
            value={hasPrompt}
            onChange={(e) => {
              setHasPrompt(e.target.value as typeof hasPrompt);
              setPage(1);
            }}
            className="w-auto"
          >
            <option value="all">Any mapping</option>
            <option value="true">Has prompt</option>
            <option value="false">No prompt</option>
          </Select>
        </div>

        {isLoading ? (
          <CenteredLoading label="Loading workflows…" />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={noFilters ? 'No workflows yet' : 'No workflows match your filters'}
            message={
              noFilters
                ? 'Run a sync from n8n to load workflows.'
                : 'Try clearing the search or filters.'
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(w) => w.workflowId}
              onRowClick={(w) => navigate(paths.workflow(w.workflowId))}
              sort={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
              isRefreshing={isFetching}
            />
            {data && <Pagination meta={data.pagination} onPageChange={setPage} />}
          </>
        )}
      </Card>
    </div>
  );
}
