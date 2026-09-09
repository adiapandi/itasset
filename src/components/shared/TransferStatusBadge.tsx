const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-surface-sunken text-ink-soft",
  PENDING_APPROVAL: "bg-warn-soft text-warn",
  APPROVED: "bg-accent-soft text-accent",
  REJECTED: "bg-danger-soft text-danger",
  IN_TRANSIT: "bg-warn-soft text-warn",
  RECEIVED: "bg-accent-soft text-accent",
  COMPLETED: "bg-accent-soft text-accent",
  CANCELLED: "bg-surface-sunken text-ink-soft",
};

export function TransferStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_STYLES[status] ?? "bg-surface-sunken text-ink-soft"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
