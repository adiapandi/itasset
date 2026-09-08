"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Option {
  id: string;
  name: string;
}

export function NewAssetForm({
  categories,
  vendors,
  departments,
  rooms,
}: {
  categories: Option[];
  vendors: Option[];
  departments: Option[];
  rooms: Option[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    brand: "",
    serialNumber: "",
    vendorId: "",
    departmentId: "",
    currentRoomId: "",
    purchaseDate: "",
    purchasePrice: "",
    warrantyEndDate: "",
    condition: "GOOD",
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        vendorId: form.vendorId || undefined,
        departmentId: form.departmentId || undefined,
        currentRoomId: form.currentRoomId || undefined,
        purchaseDate: form.purchaseDate || undefined,
        warrantyEndDate: form.warrantyEndDate || undefined,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not create asset. Check the fields and try again.");
      return;
    }

    const { data } = await res.json();
    router.push(`/assets/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-surface p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
            placeholder="e.g. Laptop Dell Latitude 5440"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Category</label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
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
            onChange={(e) => set("brand", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Serial number</label>
          <input
            value={form.serialNumber}
            onChange={(e) => set("serialNumber", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Condition</label>
          <select
            value={form.condition}
            onChange={(e) => set("condition", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          >
            {["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"].map((c) => (
              <option key={c} value={c}>
                {c[0] + c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Vendor</label>
          <select
            value={form.vendorId}
            onChange={(e) => set("vendorId", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          >
            <option value="">— None —</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Department</label>
          <select
            value={form.departmentId}
            onChange={(e) => set("departmentId", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          >
            <option value="">— None —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Current room</label>
          <select
            value={form.currentRoomId}
            onChange={(e) => set("currentRoomId", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          >
            <option value="">— None —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-soft">
            The room&apos;s Primary PIC automatically becomes accountable for this asset.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Purchase date</label>
          <input
            type="date"
            value={form.purchaseDate}
            onChange={(e) => set("purchaseDate", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Purchase price</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.purchasePrice}
            onChange={(e) => set("purchasePrice", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Warranty end date</label>
          <input
            type="date"
            value={form.warrantyEndDate}
            onChange={(e) => set("warrantyEndDate", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="rounded bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save asset"}
        </button>
      </div>
    </form>
  );
}
