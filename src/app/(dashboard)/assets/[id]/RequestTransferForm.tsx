"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Room {
  id: string;
  name: string;
}

export function RequestTransferForm({
  assetId,
  rooms,
  currentRoomId,
}: {
  assetId: string;
  rooms: Room[];
  currentRoomId: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ toRoomId: "", reason: "" });

  const options = rooms.filter((r) => r.id !== currentRoomId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, toRoomId: form.toRoomId, reason: form.reason || undefined }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not create transfer request.");
      return;
    }

    const { data } = await res.json();
    router.push(`/transfers/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <select
        required
        value={form.toRoomId}
        onChange={(e) => setForm((f) => ({ ...f, toRoomId: e.target.value }))}
        className="w-full rounded border border-border px-2 py-1.5 text-sm"
      >
        <option value="">Move to room…</option>
        {options.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <input
        value={form.reason}
        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
        placeholder="Reason (optional)"
        className="w-full rounded border border-border px-2 py-1.5 text-sm"
      />
      {error && <p className="rounded bg-danger-soft px-2 py-1 text-xs text-danger">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Request transfer"}
      </button>
    </form>
  );
}
