"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TransferActions({
  transferId,
  canApprove,
  canReceive,
  canCancel,
}: {
  transferId: string;
  canApprove: boolean;
  canReceive: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function act(action: "APPROVED" | "REJECTED" | "REVISION_REQUESTED") {
    setSubmitting(action);
    setError(null);
    const res = await fetch(`/api/transfers/${transferId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, comment: comment || undefined }),
    });
    setSubmitting(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Action failed.");
      return;
    }
    setComment("");
    router.refresh();
  }

  async function receive() {
    setSubmitting("RECEIVE");
    setError(null);
    const res = await fetch(`/api/transfers/${transferId}/receive`, { method: "POST" });
    setSubmitting(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not confirm receipt.");
      return;
    }
    router.refresh();
  }

  async function cancel() {
    if (!confirm("Cancel this transfer request?")) return;
    setSubmitting("CANCEL");
    setError(null);
    const res = await fetch(`/api/transfers/${transferId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setSubmitting(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not cancel transfer.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {canApprove && (
        <div className="space-y-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comment (optional)"
            className="w-full rounded border border-border px-2 py-1.5 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => act("APPROVED")}
              disabled={!!submitting}
              className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting === "APPROVED" ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={() => act("REJECTED")}
              disabled={!!submitting}
              className="rounded bg-danger px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting === "REJECTED" ? "Rejecting…" : "Reject"}
            </button>
            <button
              onClick={() => act("REVISION_REQUESTED")}
              disabled={!!submitting}
              className="rounded border border-border px-3 py-1.5 text-sm text-ink hover:bg-surface-sunken disabled:opacity-60"
            >
              {submitting === "REVISION_REQUESTED" ? "Sending back…" : "Request revision"}
            </button>
          </div>
        </div>
      )}

      {canReceive && (
        <button
          onClick={receive}
          disabled={!!submitting}
          className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {submitting === "RECEIVE" ? "Confirming…" : "Confirm receipt"}
        </button>
      )}

      {canCancel && (
        <button
          onClick={cancel}
          disabled={!!submitting}
          className="rounded border border-border px-3 py-1.5 text-sm text-danger hover:bg-danger-soft disabled:opacity-60"
        >
          {submitting === "CANCEL" ? "Cancelling…" : "Cancel request"}
        </button>
      )}

      {error && <p className="rounded bg-danger-soft px-2 py-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
