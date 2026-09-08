"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
}

export function AssignEmployeeForm({ assetId, users }: { assetId: string; users: User[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ userId: "", reason: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/assets/${assetId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not assign asset.");
      return;
    }

    setForm({ userId: "", reason: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-xs font-medium text-ink-soft">Assign to employee</p>
      <select
        required
        value={form.userId}
        onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
        className="w-full rounded border border-border px-2 py-1.5 text-sm"
      >
        <option value="">Select employee…</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
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
        className="w-full rounded bg-ink py-1.5 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
      >
        {submitting ? "Assigning…" : "Assign"}
      </button>
    </form>
  );
}
