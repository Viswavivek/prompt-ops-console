import { useMemo } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

/**
 * GitHub-style prompt diff (docs spec §7). Uses a mature diff library rather
 * than a hand-rolled algorithm.
 */
export function VersionDiff({
  oldValue,
  newValue,
  oldTitle,
  newTitle,
  splitView,
}: {
  oldValue: string;
  newValue: string;
  oldTitle: string;
  newTitle: string;
  splitView: boolean;
}) {
  const isDark = useMemo(
    () =>
      typeof document !== 'undefined' &&
      (document.documentElement.classList.contains('dark') ||
        window.matchMedia?.('(prefers-color-scheme: dark)').matches),
    [],
  );

  return (
    <div className="overflow-x-auto rounded-md border border-border text-sm">
      <ReactDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={splitView}
        compareMethod={DiffMethod.WORDS}
        leftTitle={oldTitle}
        rightTitle={newTitle}
        useDarkTheme={isDark}
        showDiffOnly={newValue.length + oldValue.length > 4000}
        extraLinesSurroundingDiff={3}
        styles={{
          contentText: { fontFamily: 'var(--font-mono, monospace)', fontSize: '12.5px' },
          titleBlock: { fontSize: '12px' },
        }}
      />
    </div>
  );
}
