import { formatDistanceToNowStrict, format, isValid, parseISO } from 'date-fns';

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null) return null;
  const d = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(d) ? d : null;
}

/** "3 hours ago" / "just now". Falls back to "—". */
export function relativeTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  const secs = Math.abs(Date.now() - d.getTime()) / 1000;
  if (secs < 45) return 'just now';
  return `${formatDistanceToNowStrict(d)} ago`;
}

/** "Sep 6, 2026, 08:36" */
export function absoluteTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, 'MMM d, yyyy, HH:mm') : '—';
}

/** "Sep 6, 2026" */
export function dateOnly(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, 'MMM d, yyyy') : '—';
}

/** 1234567 -> "1,234,567"; compact for big values -> "3.2M". */
export function formatNumber(n: number | null | undefined, opts?: { compact?: boolean }): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (opts?.compact && Math.abs(n) >= 10_000) {
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(
      n,
    );
  }
  return new Intl.NumberFormat().format(n);
}

/** milliseconds -> "1.2s" / "540ms" / "2m 3s". */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

/** Fallback for possibly-empty strings. */
export function orDash(value: string | null | undefined): string {
  return value && value.trim() ? value : '—';
}
