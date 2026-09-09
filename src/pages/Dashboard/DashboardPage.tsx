import { useQuery } from '@tanstack/react-query';
import { Workflow, FileText, PlayCircle, AlertCircle } from 'lucide-react';
import { workflowApi, executionApi, promptApi } from '@/services';
import { qk } from '@/lib/queryClient';
import { isApiError } from '@/services';

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | string;
  icon: typeof Workflow;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-content-muted">{label}</span>
        <Icon className="h-4 w-4 text-content-subtle" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-content">
        {loading ? <span className="text-content-subtle">…</span> : value}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const workflows = useQuery({
    queryKey: qk.workflows.list({ pageSize: 1 }),
    queryFn: () => workflowApi.list({ pageSize: 1 }),
  });
  const prompts = useQuery({
    queryKey: qk.prompts.list({ pageSize: 1 }),
    queryFn: () => promptApi.list({ pageSize: 1 }),
  });
  const executions = useQuery({
    queryKey: qk.executions.list({ pageSize: 1 }),
    queryFn: () => executionApi.list({ pageSize: 1 }),
  });

  const anyError = [workflows.error, prompts.error, executions.error].find(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-content">Dashboard</h1>
        <p className="text-sm text-content-muted">
          Scaffold build — service layer, auth, and mock backend are wired. Feature modules land in
          Phase 2+.
        </p>
      </div>

      {anyError && (
        <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4" />
          {isApiError(anyError) ? anyError.message : 'Failed to load dashboard data.'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Workflows"
          value={workflows.data?.pagination.total ?? 0}
          icon={Workflow}
          loading={workflows.isLoading}
        />
        <StatCard
          label="Prompts"
          value={prompts.data?.pagination.total ?? 0}
          icon={FileText}
          loading={prompts.isLoading}
        />
        <StatCard
          label="Executions"
          value={executions.data?.pagination.total ?? 0}
          icon={PlayCircle}
          loading={executions.isLoading}
        />
      </div>
    </div>
  );
}
