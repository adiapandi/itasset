"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ScanForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [assetCode, setAssetCode] = useState("");
  const [markDamaged, setMarkDamaged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetCode.trim()) return;
    setSubmitting(true);
    setFeedback(null);

    const res = await fetch(`/api/audits/${sessionId}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetCode: assetCode.trim(), markDamaged }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFeedback({ type: "error", message: typeof body.error === "string" ? body.error : "Scan failed." });
      inputRef.current?.focus();
      return;
    }

    const { data } = await res.json();
    setFeedback({
      type: "success",
      message: `${data.assetName} (${data.assetCode}) — ${markDamaged ? "marked damaged" : data.result.replace(/_/g, " ").toLowerCase()}`,
    });
    setAssetCode("");
    setMarkDamaged(false);
    inputRef.current?.focus();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          autoFocus
          value={assetCode}
          onChange={(e) => setAssetCode(e.target.value)}
          placeholder="AST-LPT-000001"
          className="flex-1 rounded border border-border px-3 py-2 text-sm font-mono"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {submitting ? "Scanning…" : "Scan"}
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={markDamaged} onChange={(e) => setMarkDamaged(e.target.checked)} />
        This asset is damaged
      </label>
      {feedback && (
        <p
          className={
            feedback.type === "success"
              ? "rounded bg-accent-soft px-2 py-1 text-xs text-accent"
              : "rounded bg-danger-soft px-2 py-1 text-xs text-danger"
          }
        >
          {feedback.message}
        </p>
      )}
    </form>
  );
}
