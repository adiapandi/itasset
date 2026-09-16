const RESULT_STYLES: Record<string, string> = {
  VERIFIED: "bg-accent-soft text-accent",
  WRONG_LOCATION: "bg-warn-soft text-warn",
  DAMAGED: "bg-danger-soft text-danger",
  MISSING: "bg-danger-soft text-danger",
  EXTRA: "bg-warn-soft text-warn",
};

export function AuditResultBadge({ result }: { result: string | null }) {
  if (!result) {
    return <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-xs text-ink-soft">Not scanned</span>;
  }
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${RESULT_STYLES[result] ?? "bg-surface-sunken text-ink-soft"}`}>
      {result.replace(/_/g, " ")}
    </span>
  );
}

const SESSION_STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: "bg-warn-soft text-warn",
  COMPLETED: "bg-accent-soft text-accent",
  CANCELLED: "bg-surface-sunken text-ink-soft",
};

export function AuditSessionStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${SESSION_STATUS_STYLES[status] ?? "bg-surface-sunken text-ink-soft"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
