import { Badge } from '@/components/common';

export function WorkflowStatusBadge({ active }: { active?: boolean }) {
  if (active == null) return <Badge tone="muted">unknown</Badge>;
  return active ? (
    <Badge tone="success">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      active
    </Badge>
  ) : (
    <Badge tone="neutral">
      <span className="h-1.5 w-1.5 rounded-full bg-content-subtle" />
      inactive
    </Badge>
  );
}
