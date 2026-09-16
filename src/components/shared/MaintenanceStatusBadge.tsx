const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-warn-soft text-warn",
  IN_PROGRESS: "bg-warn-soft text-warn",
  COMPLETED: "bg-accent-soft text-accent",
  CANCELLED: "bg-surface-sunken text-ink-soft",
};

export function MaintenanceStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_STYLES[status] ?? "bg-surface-sunken text-ink-soft"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
