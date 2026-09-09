import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Save, X, RotateCcw, GitCompare, History, Pencil } from 'lucide-react';
import { usePrompt } from '@/hooks/usePrompts';
import {
  usePromptVersions,
  usePromptVersion,
  useCreatePromptVersion,
  useRestorePromptVersion,
} from '@/hooks/usePromptVersions';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
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
  ConfirmDialog,
} from '@/components/common';
import { PromptEditor } from '@/components/prompts/PromptEditor';
import { validatePrompt, type PromptValidation } from '@/components/prompts/promptValidation';
import { SavePromptDialog } from '@/components/prompts/SavePromptDialog';
import { VersionHistoryPanel } from '@/components/versions/VersionHistoryPanel';
import { absoluteTime, orDash } from '@/lib/format';
import { paths } from '@/routes/paths';

export function PromptPage() {
  const { promptId } = useParams<{ promptId: string }>();
  const prompt = usePrompt(promptId);
  const versionsQ = usePromptVersions(promptId);
  const versions = useMemo(() => versionsQ.data ?? [], [versionsQ.data]);
  const currentVersionNo = versions[0]?.version;
  const prevVersionNo = versions[1]?.version;
  const compareHref =
    prevVersionNo != null && currentVersionNo != null
      ? `${paths.promptCompare(promptId)}?a=${prevVersionNo}&b=${currentVersionNo}`
      : null;

  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(undefined);
  const viewingVersion = selectedVersion ?? currentVersionNo;
  const isViewingCurrent = viewingVersion === currentVersionNo;

  const selectedQ = usePromptVersion(promptId, viewingVersion);
  const currentContent = useMemo(
    () => versions.find((v) => v.version === currentVersionNo)?.promptComment ?? '',
    [versions, currentVersionNo],
  );

  const [draft, setDraft] = useState('');
  const [validation, setValidation] = useState<PromptValidation>({ ok: true });
  const [saveOpen, setSaveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const createVersion = useCreatePromptVersion(promptId ?? '');
  const restore = useRestorePromptVersion(promptId ?? '');

  // Seed the draft when the current version content loads.
  useEffect(() => {
    if (isViewingCurrent && selectedQ.data) setDraft(selectedQ.data.promptComment);
  }, [isViewingCurrent, selectedQ.data]);

  const dirty = isViewingCurrent && draft !== currentContent && currentContent !== '';
  const guard = useUnsavedChangesGuard(dirty);

  if (prompt.isLoading || versionsQ.isLoading) return <CenteredLoading label="Loading prompt…" />;
  if (prompt.error || !prompt.data)
    return <ErrorState error={prompt.error} onRetry={() => prompt.refetch()} title="Prompt not found" />;

  const p = prompt.data;

  const handleSave = async (changeSummary: string) => {
    const v = validatePrompt(draft, 'plaintext');
    if (!v.ok) return;
    await createVersion.mutateAsync({
      promptComment: draft,
      changeSummary: changeSummary || undefined,
      baseVersion: currentVersionNo,
    });
    setSaveOpen(false);
    setSelectedVersion(undefined);
  };

  return (
    <div>
      <guard.Prompt />
      <PageHeader
        breadcrumbs={[{ label: 'Prompts', to: paths.prompts }, { label: p.promptName }]}
        title={
          <span className="flex items-center gap-2">
            {p.promptName}
            <Badge tone="success">v{currentVersionNo} current</Badge>
            {dirty && <Badge tone="warning">unsaved changes</Badge>}
          </span>
        }
        actions={
          compareHref && (
            <Link to={compareHref}>
              <Button variant="secondary">
                <GitCompare className="h-4 w-4" />
                Compare
              </Button>
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  {isViewingCurrent ? (
                    <>
                      <Pencil className="h-4 w-4 text-content-subtle" /> Editing v{currentVersionNo}
                    </>
                  ) : (
                    <>
                      <History className="h-4 w-4 text-content-subtle" /> Viewing v{viewingVersion}{' '}
                      (read-only)
                    </>
                  )}
                </span>
              }
              actions={
                isViewingCurrent ? (
                  <>
                    <Button
                      variant="ghost"
                      disabled={!dirty || createVersion.isPending}
                      onClick={() => setCancelOpen(true)}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      disabled={!dirty || !validation.ok}
                      onClick={() => setSaveOpen(true)}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => setSelectedVersion(undefined)}>
                      Back to current
                    </Button>
                    <Button
                      variant="secondary"
                      loading={restore.isPending}
                      onClick={() => restore.mutate(viewingVersion!)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore this version
                    </Button>
                  </>
                )
              }
            />
            <CardBody>
              {selectedQ.isLoading ? (
                <CenteredLoading label="Loading version…" />
              ) : selectedQ.error ? (
                <ErrorState error={selectedQ.error} onRetry={() => selectedQ.refetch()} />
              ) : isViewingCurrent ? (
                <PromptEditor
                  value={draft}
                  onChange={setDraft}
                  onValidationChange={setValidation}
                  height={460}
                />
              ) : (
                <PromptEditor
                  value={selectedQ.data?.promptComment ?? ''}
                  readOnly
                  height={460}
                />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Metadata" />
            <CardBody>
              <dl className="space-y-2.5 text-sm">
                <Row label="Prompt ID">
                  <span className="font-mono">#{p.promptId}</span>
                  <CopyButton value={p.promptId} />
                </Row>
                <Row label="Current version">v{currentVersionNo}</Row>
                <Row label="Versions">{p.versionCount}</Row>
                <Row label="Created by">{orDash(p.createdBy)}</Row>
                <Row label="Created">{absoluteTime(p.createdAt)}</Row>
                <Row label="Last modified">{absoluteTime(p.changedAt)}</Row>
                <Row label="Last modified by">{orDash(p.changedBy)}</Row>
                {p.mappedWorkflows.length > 0 && (
                  <Row label="Workflows">
                    <span className="flex flex-col items-end gap-1">
                      {p.mappedWorkflows.map((w) => (
                        <Link
                          key={w.workflowId}
                          to={paths.workflow(w.workflowId)}
                          className="text-brand hover:underline"
                        >
                          {w.workflowName}
                        </Link>
                      ))}
                    </span>
                  </Row>
                )}
              </dl>
            </CardBody>
          </Card>

          <VersionHistoryPanel
            promptId={promptId ?? ''}
            selectedVersion={viewingVersion}
            onSelectVersion={(v) => setSelectedVersion(v === currentVersionNo ? undefined : v)}
          />
        </div>
      </div>

      <SavePromptDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={handleSave}
        previousContent={currentContent}
        nextContent={draft}
        nextVersionNumber={(currentVersionNo ?? 0) + 1}
        saving={createVersion.isPending}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => setDraft(currentContent)}
        title="Discard your edits?"
        message="This reverts the editor to the current saved version. It cannot be undone."
        confirmLabel="Discard edits"
        destructive
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-content-subtle">{label}</dt>
      <dd className="flex items-center gap-1.5 text-right text-content">{children}</dd>
    </div>
  );
}
