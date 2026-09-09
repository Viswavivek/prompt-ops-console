import { RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useSyncStatus, useSyncWorkflows } from '@/hooks/useWorkflows';
import { Button } from '@/components/common';
import { relativeTime } from '@/lib/format';

/** Compact sync indicator + trigger. Full sync UI lands in Phase 4 (Step 24). */
export function SyncStatusBar() {
  const { data, isLoading } = useSyncStatus({ poll: true });
  const sync = useSyncWorkflows();

  const running = data?.status === 'running' || sync.isPending;
  const hasErrors = (data?.errors?.length ?? 0) > 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-surface px-3 py-2 text-xs text-content-muted">
      {isLoading ? (
        <span className="flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking sync status…
        </span>
      ) : running ? (
        <span className="flex items-center gap-1.5 text-brand">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing workflows from n8n…
        </span>
      ) : hasErrors ? (
        <span className="flex items-center gap-1.5 text-warning">
          <AlertTriangle className="h-3.5 w-3.5" />
          Last sync had {data!.errors!.length} error(s)
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          Last synced {relativeTime(data?.lastSyncAt)}
        </span>
      )}

      {data && (
        <span className="text-content-subtle">· {data.workflowCount} workflows loaded</span>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="ml-auto"
        loading={running}
        onClick={() => sync.mutate()}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Sync from n8n
      </Button>
    </div>
  );
}
