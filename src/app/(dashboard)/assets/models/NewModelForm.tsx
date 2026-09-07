"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

export function NewModelForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", categoryId: "", brand: "", manufacturer: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/asset-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not create model.");
      return;
    }

    setForm({ name: "", categoryId: "", brand: "", manufacturer: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft"
      >
        Add model
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-surface p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
            placeholder="Latitude 5440"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Category</label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          >
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Brand</label>
          <input
            value={form.brand}
            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
            placeholder="Dell"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Manufacturer</label>
          <input
            value={form.manufacturer}
            onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="rounded bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save model"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-sunken"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
