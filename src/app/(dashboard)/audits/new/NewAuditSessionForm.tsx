"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Room {
  id: string;
  name: string;
  _count: { assets: number };
}

export function NewAuditSessionForm({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ roomId: "", name: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/audits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: form.roomId, name: form.name || undefined }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not start audit.");
      return;
    }

    const { data } = await res.json();
    router.push(`/audits/${data.id}`);
  }

  const selectedRoom = rooms.find((r) => r.id === form.roomId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-surface p-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Room</label>
        <select
          required
          value={form.roomId}
          onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
          className="w-full rounded border border-border px-3 py-2 text-sm"
        >
          <option value="">Select room…</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r._count.assets} asset{r._count.assets === 1 ? "" : "s"} expected)
            </option>
          ))}
        </select>
        {selectedRoom && (
          <p className="mt-1 text-xs text-ink-soft">
            {selectedRoom._count.assets} asset(s) currently on record for this room will be snapshotted.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Session name (optional)</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. IT Asset Audit — September 2026"
          className="w-full rounded border border-border px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="rounded bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
      >
        {submitting ? "Starting…" : "Start audit"}
      </button>
    </form>
  );
}
