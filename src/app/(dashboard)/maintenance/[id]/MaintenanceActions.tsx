"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MaintenanceActions({ recordId, status }: { recordId: string; status: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [form, setForm] = useState({ actionTaken: "", result: "", cost: "", warrantyClaim: false });

  async function start() {
    setSubmitting("start");
    setError(null);
    const res = await fetch(`/api/maintenance/${recordId}/start`, { method: "POST" });
    setSubmitting(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not start maintenance.");
      return;
    }
    router.refresh();
  }

  async function complete(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting("complete");
    setError(null);
    const res = await fetch(`/api/maintenance/${recordId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cost: form.cost ? Number(form.cost) : undefined,
      }),
    });
    setSubmitting(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not complete maintenance.");
      return;
    }
    router.refresh();
  }

  async function cancel() {
    if (!confirm("Cancel this maintenance record?")) return;
    setSubmitting("cancel");
    setError(null);
    const res = await fetch(`/api/maintenance/${recordId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setSubmitting(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not cancel maintenance.");
      return;
    }
    router.refresh();
  }

  if (showComplete) {
    return (
      <form onSubmit={complete} className="space-y-2">
        <div>
          <label className="block text-xs text-ink-soft mb-1">Action taken *</label>
          <input
            required
            value={form.actionTaken}
            onChange={(e) => setForm((f) => ({ ...f, actionTaken: e.target.value }))}
            className="w-full rounded border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1">Result</label>
          <input
            value={form.result}
            onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
            className="w-full rounded border border-border px-2 py-1.5 text-sm"
            placeholder="e.g. Repaired, Replaced part, No fault found"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1">Cost</label>
          <input
            type="number"
            min={0}
            value={form.cost}
            onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            className="w-full rounded border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.warrantyClaim}
            onChange={(e) => setForm((f) => ({ ...f, warrantyClaim: e.target.checked }))}
          />
          Warranty claim used
        </label>
        {error && <p className="rounded bg-danger-soft px-2 py-1 text-xs text-danger">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!!submitting}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting === "complete" ? "Completing…" : "Mark completed"}
          </button>
          <button
            type="button"
            onClick={() => setShowComplete(false)}
            className="rounded px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-sunken"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "SCHEDULED" && (
        <button
          onClick={start}
          disabled={!!submitting}
          className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {submitting === "start" ? "Starting…" : "Start"}
        </button>
      )}
      <button
        onClick={() => setShowComplete(true)}
        className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
      >
        Mark completed
      </button>
      <button
        onClick={cancel}
        disabled={!!submitting}
        className="rounded border border-border px-3 py-1.5 text-sm text-danger hover:bg-danger-soft disabled:opacity-60"
      >
        {submitting === "cancel" ? "Cancelling…" : "Cancel"}
      </button>
      {error && <p className="w-full rounded bg-danger-soft px-2 py-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
