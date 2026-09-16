"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SessionActions({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function complete() {
    if (!confirm("Complete this audit? Any expected asset not yet scanned will be marked Missing.")) return;
    setSubmitting("complete");
    await fetch(`/api/audits/${sessionId}/complete`, { method: "POST" });
    setSubmitting(null);
    router.refresh();
  }

  async function cancel() {
    if (!confirm("Cancel this audit session?")) return;
    setSubmitting("cancel");
    await fetch(`/api/audits/${sessionId}/cancel`, { method: "POST" });
    setSubmitting(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={complete}
        disabled={!!submitting}
        className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {submitting === "complete" ? "Completing…" : "Complete audit"}
      </button>
      <button
        onClick={cancel}
        disabled={!!submitting}
        className="rounded border border-border px-3 py-1.5 text-sm text-danger hover:bg-danger-soft disabled:opacity-60"
      >
        {submitting === "cancel" ? "Cancelling…" : "Cancel"}
      </button>
    </div>
  );
}
