/**
 * Derives a human-readable change summary between two prompt bodies.
 * The schema has no per-version "change summary" column (docs/ASSUMPTIONS.md B5),
 * so the UI computes one from the content itself.
 */

export function firstLine(text: string, maxLen = 80): string {
  const line = text.split('\n').find((l) => l.trim().length > 0)?.trim() ?? '';
  return line.length > maxLen ? `${line.slice(0, maxLen - 1)}…` : line;
}

export function charDelta(prev: string, next: string): { added: number; removed: number } {
  // Coarse line-based delta — enough for a summary chip, not a real diff.
  const prevLines = prev.split('\n');
  const nextLines = next.split('\n');
  const prevSet = new Set(prevLines);
  const nextSet = new Set(nextLines);
  const added = nextLines.filter((l) => !prevSet.has(l)).join('\n').length;
  const removed = prevLines.filter((l) => !nextSet.has(l)).join('\n').length;
  return { added, removed };
}

export function summarizeChange(prev: string | undefined, next: string): string {
  if (prev == null) return firstLine(next) || 'Initial version';
  if (prev === next) return 'No content change';
  const { added, removed } = charDelta(prev, next);
  const parts: string[] = [];
  if (added) parts.push(`+${added}`);
  if (removed) parts.push(`−${removed}`);
  const delta = parts.length ? ` (${parts.join(' / ')} chars)` : '';
  return `${firstLine(next)}${delta}`;
}
