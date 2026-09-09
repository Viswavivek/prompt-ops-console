import { Construction } from 'lucide-react';

/** Temporary page body used while a feature module is still being built. */
export function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 py-24 text-center">
      <Construction className="h-8 w-8 text-content-subtle" aria-hidden />
      <h1 className="text-lg font-semibold text-content">{title}</h1>
      <p className="text-sm text-content-muted">{note}</p>
    </div>
  );
}
