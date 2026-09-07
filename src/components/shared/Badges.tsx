const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-accent-soft text-accent",
  ASSIGNED: "bg-accent-soft text-accent",
  IN_STORAGE: "bg-surface-sunken text-ink-soft",
  UNDER_MAINTENANCE: "bg-warn-soft text-warn",
  DAMAGED: "bg-danger-soft text-danger",
  LOST: "bg-danger-soft text-danger",
  STOLEN: "bg-danger-soft text-danger",
  RETIRED: "bg-surface-sunken text-ink-soft",
  DISPOSED: "bg-surface-sunken text-ink-soft",
};

const CONDITION_STYLES: Record<string, string> = {
  EXCELLENT: "bg-accent-soft text-accent",
  GOOD: "bg-accent-soft text-accent",
  FAIR: "bg-warn-soft text-warn",
  POOR: "bg-warn-soft text-warn",
  DAMAGED: "bg-danger-soft text-danger",
};

function toLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_STYLES[status] ?? "bg-surface-sunken text-ink-soft"}`}>
      {toLabel(status)}
    </span>
  );
}

export function ConditionBadge({ condition }: { condition: string }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs ${CONDITION_STYLES[condition] ?? "bg-surface-sunken text-ink-soft"}`}
    >
      {toLabel(condition)}
    </span>
  );
}
