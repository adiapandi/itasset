"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

export function NewCategoryForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", parentCategoryId: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/asset-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, parentCategoryId: form.parentCategoryId || undefined }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not create category.");
      return;
    }

    setForm({ name: "", code: "", parentCategoryId: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft"
      >
        Add category
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-surface p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
            placeholder="Laptop"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Code</label>
          <input
            required
            maxLength={10}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="w-full rounded border border-border px-3 py-2 text-sm font-mono uppercase"
            placeholder="LPT"
          />
          <p className="mt-1 text-xs text-ink-soft">Used as the asset-code prefix, e.g. AST-LPT-000123.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Parent category</label>
          <select
            value={form.parentCategoryId}
            onChange={(e) => setForm((f) => ({ ...f, parentCategoryId: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="rounded bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save category"}
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
