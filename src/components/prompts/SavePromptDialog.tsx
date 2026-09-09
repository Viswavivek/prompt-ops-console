import { useState } from 'react';
import { Modal, Button, FieldLabel, FieldError } from '@/components/common';
import { summarizeChange } from '@/utils/diffSummary';

/**
 * Save = create a new version (docs spec §8). Historical versions are never overwritten.
 * The change summary is optional and only persisted if the backend supports it
 * (docs/ASSUMPTIONS.md B5) — the derived summary is always shown as a hint.
 */
export function SavePromptDialog({
  open,
  onClose,
  onSave,
  previousContent,
  nextContent,
  nextVersionNumber,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (changeSummary: string) => void | Promise<void>;
  previousContent: string | undefined;
  nextContent: string;
  nextVersionNumber: number;
  saving: boolean;
}) {
  const derived = summarizeChange(previousContent, nextContent);
  const [summary, setSummary] = useState('');

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title="Save as new version"
      description={`This creates version ${nextVersionNumber}. Previous versions are kept unchanged.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={() => onSave(summary.trim())}>
            Save version {nextVersionNumber}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="rounded-md bg-surface-muted px-3 py-2 text-xs text-content-muted">
          <span className="font-medium text-content-subtle">Detected change: </span>
          {derived}
        </div>
        <div>
          <FieldLabel htmlFor="change-summary" hint="optional">
            Change summary
          </FieldLabel>
          <textarea
            id="change-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="What changed and why?"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-content outline-none focus:border-brand"
          />
          <FieldError>
            {/* no hard validation on the summary */}
          </FieldError>
        </div>
      </div>
    </Modal>
  );
}
