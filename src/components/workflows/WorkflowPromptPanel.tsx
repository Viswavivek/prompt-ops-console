import { Link } from 'react-router-dom';
import { FileText, ArrowRight, GitBranch, Link2Off, AlertCircle } from 'lucide-react';
import { useWorkflowPrompt } from '@/hooks/useWorkflows';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  InlineLoading,
  EmptyState,
  ErrorState,
} from '@/components/common';
import { absoluteTime, orDash } from '@/lib/format';
import { paths } from '@/routes/paths';
import type { WorkflowListItem } from '@/types';

/** Step 4/14 — shows the n8n Workflow → Prompt → Versions relationship. */
export function WorkflowPromptPanel({ workflow }: { workflow: WorkflowListItem }) {
  const { data, isLoading, error, isUnmapped, refetch } = useWorkflowPrompt(workflow.workflowId);

  return (
    <Card>
      <CardHeader
        title="Mapped prompt"
        subtitle="Workflow → Prompt → Versions"
        actions={
          data && (
            <Link to={paths.prompt(data.prompt.promptId)}>
              <Button size="sm" variant="primary">
                Open prompt
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )
        }
      />
      <CardBody>
        {isLoading ? (
          <InlineLoading label="Resolving mapped prompt…" />
        ) : isUnmapped ? (
          <EmptyState
            icon={Link2Off}
            title="No prompt mapped"
            message="This workflow has no prompt associated with it in the mapping table."
          />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} title="Could not load the mapping" />
        ) : data ? (
          <div className="space-y-4">
            {/* relationship chips */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="neutral">
                <GitBranch className="h-3 w-3" />
                {workflow.workflowName} · #{workflow.workflowId}
              </Badge>
              <ArrowRight className="h-3.5 w-3.5 text-content-subtle" />
              <Badge tone="brand">
                <FileText className="h-3 w-3" />
                {data.prompt.promptName} · #{data.prompt.promptId}
              </Badge>
              <ArrowRight className="h-3.5 w-3.5 text-content-subtle" />
              <Badge tone="success">v{data.currentVersion.version} (current)</Badge>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <Meta label="Prompt name" value={data.prompt.promptName} />
              <Meta label="Prompt ID" value={`#${data.prompt.promptId}`} mono />
              <Meta label="Current version" value={`v${data.currentVersion.version}`} />
              <Meta label="Created by" value={orDash(data.prompt.createdBy)} />
              <Meta label="Created" value={absoluteTime(data.prompt.createdAt)} />
              <Meta label="Last modified" value={absoluteTime(data.prompt.changedAt)} />
              <Meta label="Last modified by" value={orDash(data.prompt.changedBy)} />
              <Meta label="Workflow" value={`${workflow.workflowName} (#${workflow.workflowId})`} />
            </dl>

            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-content-subtle">
                Current prompt content
              </p>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-surface-muted p-3 font-mono text-xs text-content">
                {data.currentVersion.promptComment}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-content-muted">
            <AlertCircle className="h-4 w-4" /> Unexpected empty response.
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-content-subtle">{label}</dt>
      <dd className={mono ? 'font-mono text-content' : 'text-content'}>{value}</dd>
    </div>
  );
}
