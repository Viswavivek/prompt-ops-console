import { JsonViewer } from '@textea/json-viewer';

/** Collapsible JSON viewer used for execution input/output and node data. */
export function JsonView({ data, rootName = false }: { data: unknown; rootName?: string | false }) {
  if (data == null) {
    return <p className="text-sm text-content-subtle">No data.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface-muted p-3 text-xs">
      <JsonViewer
        value={data}
        rootName={rootName}
        theme="auto"
        displayDataTypes={false}
        defaultInspectDepth={2}
        style={{ background: 'transparent', fontFamily: 'var(--font-mono, monospace)' }}
      />
    </div>
  );
}
