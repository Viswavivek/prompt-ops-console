import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Columns2, Rows2 } from 'lucide-react';
import { usePrompt } from '@/hooks/usePrompts';
import { usePromptVersions, usePromptVersion } from '@/hooks/usePromptVersions';
import {
  PageHeader,
  Card,
  CardBody,
  Select,
  Button,
  CenteredLoading,
  ErrorState,
} from '@/components/common';
import { VersionDiff } from '@/components/versions/VersionDiff';
import { paths } from '@/routes/paths';

export function PromptComparePage() {
  const { promptId } = useParams<{ promptId: string }>();
  const [params, setParams] = useSearchParams();

  const prompt = usePrompt(promptId);
  const versionsQ = usePromptVersions(promptId);
  const versions = useMemo(() => versionsQ.data ?? [], [versionsQ.data]);

  const latest = versions[0]?.version;
  const prev = versions[1]?.version ?? latest;

  const a = Number(params.get('a') ?? prev ?? 1);
  const b = Number(params.get('b') ?? latest ?? 1);
  const splitView = params.get('view') !== 'unified';

  const versionA = usePromptVersion(promptId, a);
  const versionB = usePromptVersion(promptId, b);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  const options = useMemo(
    () => versions.map((v) => ({ value: String(v.version), label: `v${v.version}` })),
    [versions],
  );

  if (versionsQ.isLoading || prompt.isLoading) return <CenteredLoading label="Loading versions…" />;
  if (versionsQ.error)
    return <ErrorState error={versionsQ.error} onRetry={() => versionsQ.refetch()} />;
  if (versions.length < 2)
    return (
      <ErrorState
        error={new Error('This prompt has only one version — nothing to compare yet.')}
        title="Not enough versions"
      />
    );

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Prompts', to: paths.prompts },
          { label: prompt.data?.promptName ?? `#${promptId}`, to: paths.prompt(promptId) },
          { label: 'Compare' },
        ]}
        title="Compare versions"
        actions={
          <Button
            variant="secondary"
            onClick={() => setParam('view', splitView ? 'unified' : 'split')}
          >
            {splitView ? <Rows2 className="h-4 w-4" /> : <Columns2 className="h-4 w-4" />}
            {splitView ? 'Unified' : 'Side-by-side'}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-content-subtle">Base</span>
            <Select value={String(a)} onChange={(e) => setParam('a', e.target.value)} className="w-auto">
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </label>
          <span className="text-content-subtle">vs</span>
          <label className="flex items-center gap-2">
            <span className="text-content-subtle">Compare</span>
            <Select value={String(b)} onChange={(e) => setParam('b', e.target.value)} className="w-auto">
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <CardBody>
          {versionA.isLoading || versionB.isLoading ? (
            <CenteredLoading label="Loading diff…" />
          ) : versionA.error || versionB.error ? (
            <ErrorState error={versionA.error ?? versionB.error} />
          ) : versionA.data && versionB.data ? (
            <VersionDiff
              oldValue={versionA.data.promptComment}
              newValue={versionB.data.promptComment}
              oldTitle={`v${a} · ${versionA.data.createdBy}`}
              newTitle={`v${b} · ${versionB.data.createdBy}`}
              splitView={splitView}
            />
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
