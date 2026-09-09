/** Build a query string from a record, dropping null/undefined/'' values. */
export function toQuery(params: Record<string, unknown> | object | undefined): string {
  const record = params as Record<string, unknown> | undefined;
  if (!record) return '';
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value == null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => v != null && usp.append(key, String(v)));
    } else {
      usp.append(key, String(value));
    }
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}
