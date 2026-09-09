import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, RotateCcw, Check } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  InlineLoading,
  ErrorState,
  ConfirmDialog,
} from '@/components/common';
import { usePromptVersions, useRestorePromptVersion } from '@/hooks/usePromptVersions';
import { firstLine } from '@/utils/diffSummary';
import { absoluteTime, orDash } from '@/lib/format';
import { paths } from '@/routes/paths';
import type { Id } from '@/types';

export function VersionHistoryPanel({
  promptId,
  selectedVersion,
  onSelectVersion,
}: {
  promptId: Id;
  selectedVersion?: number;
  onSelectVersion: (version: number) => void;
}) {
  const { data, isLoading, error, refetch } = usePromptVersions(promptId);
  const restore = useRestorePromptVersion(promptId);
  const [restoreTarget, setRestoreTarget] = useState<number | null>(null);

  const versions = data ?? [];
  const currentVersion = versions[0]?.version;

  return (
    <Card>
      <CardHeader
        title="Version history"
        subtitle={`${versions.length} version${versions.length === 1 ? '' : 's'}`}
        actions={
          versions.length >= 2 &&
          versions[0] &&
          versions[1] && (
            <Link
              to={`${paths.promptCompare(promptId)}?a=${versions[1].version}&b=${versions[0].version}`}
            >
              <Button size="sm" variant="secondary">
                <GitCompare className="h-3.5 w-3.5" />
                Compare
              </Button>
            </Link>
          )
        }
      />
      <CardBody className="p-0">
        {isLoading ? (
          <div className="p-4">
            <InlineLoading />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {versions.map((v) => {
              const isCurrent = v.version === currentVersion;
              const isSelected = v.version === selectedVersion;
              return (
                <li
                  key={v.promptVersionId}
                  className={`cursor-pointer px-4 py-3 transition-colors hover:bg-surface-muted ${
                    isSelected ? 'bg-brand/5' : ''
                  }`}
                  onClick={() => onSelectVersion(v.version)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-content">
                        v{v.version}
                      </span>
                      {isCurrent && (
                        <Badge tone="success">
                          <Check className="h-3 w-3" />
                          current
                        </Badge>
                      )}
                      {isSelected && !isCurrent && <Badge tone="brand">viewing</Badge>}
                    </div>
                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRestoreTarget(v.version);
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-content-muted">
                    {v.promptComment ? firstLine(v.promptComment, 90) : '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-content-subtle">
                    {orDash(v.createdBy)} · {absoluteTime(v.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>

      <ConfirmDialog
        open={restoreTarget != null}
        onClose={() => setRestoreTarget(null)}
        onConfirm={async () => {
          if (restoreTarget != null) await restore.mutateAsync(restoreTarget);
        }}
        title={`Restore version ${restoreTarget}?`}
        message={`This creates a new version with v${restoreTarget}'s content. It does not delete or overwrite any existing version.`}
        confirmLabel="Restore as new version"
      />
    </Card>
  );
}
