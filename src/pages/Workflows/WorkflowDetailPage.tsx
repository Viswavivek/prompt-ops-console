import { useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useWorkflow, useWorkflowTasks } from '@/hooks/useWorkflows';
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge';
import { WorkflowPromptPanel } from '@/components/workflows/WorkflowPromptPanel';
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  CopyButton,
  CenteredLoading,
  ErrorState,
  InlineLoading,
} from '@/components/common';
import { absoluteTime, relativeTime, orDash } from '@/lib/format';
import { paths } from '@/routes/paths';

export function WorkflowDetailPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { data: wf, isLoading, error, refetch, isFetching } = useWorkflow(workflowId);
  const tasks = useWorkflowTasks(workflowId);

  if (isLoading) return <CenteredLoading label="Loading workflow…" />;
  if (error || !wf)
    return <ErrorState error={error} onRetry={() => refetch()} title="Workflow not found" />;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Workflows', to: paths.workflows }, { label: wf.workflowName }]}
        title={
          <span className="flex items-center gap-2">
            {wf.workflowName}
            <WorkflowStatusBadge active={wf.active} />
          </span>
        }
        description={wf.description}
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <WorkflowPromptPanel workflow={wf} />

          <Card>
            <CardHeader title="Tasks / nodes" subtitle={`${wf.taskCount ?? 0} tasks`} />
            <CardBody className="p-0">
              {tasks.isLoading ? (
                <div className="p-4">
                  <InlineLoading />
                </div>
              ) : tasks.error ? (
                <div className="p-4">
                  <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {(tasks.data ?? []).map((t) => (
                    <li key={t.taskId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-content">{t.taskName}</span>
                      {t.nodeName && <Badge tone="neutral">{t.nodeName}</Badge>}
                    </li>
                  ))}
                  {(tasks.data ?? []).length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-content-muted">
                      No tasks recorded for this workflow.
                    </li>
                  )}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <dl className="space-y-2.5 text-sm">
                <Row label="Workflow ID">
                  <span className="font-mono">#{wf.workflowId}</span>
                  <CopyButton value={wf.workflowId} />
                </Row>
                {wf.n8nWorkflowId && (
                  <Row label="n8n ID">
                    <span className="font-mono">{wf.n8nWorkflowId}</span>
                    <CopyButton value={wf.n8nWorkflowId} />
                  </Row>
                )}
                <Row label="Status">
                  <WorkflowStatusBadge active={wf.active} />
                </Row>
                <Row label="Last updated">{relativeTime(wf.updatedAt)}</Row>
                <Row label="Created">{absoluteTime(wf.createdAt)}</Row>
                <Row label="Created by">{orDash(wf.createdBy)}</Row>
                <Row label="Changed by">{orDash(wf.changedBy)}</Row>
                {wf.tags && wf.tags.length > 0 && (
                  <Row label="Tags">
                    <span className="flex flex-wrap gap-1">
                      {wf.tags.map((tag) => (
                        <Badge key={tag} tone="muted">
                          {tag}
                        </Badge>
                      ))}
                    </span>
                  </Row>
                )}
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-content-subtle">{label}</dt>
      <dd className="flex items-center gap-1.5 text-content">{children}</dd>
    </div>
  );
}
