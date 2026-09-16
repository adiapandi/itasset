"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Vendor {
  id: string;
  name: string;
}

export function ScheduleMaintenanceForm({ assetId, vendors }: { assetId: string; vendors: Vendor[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    maintenanceType: "",
    vendorId: "",
    technicianName: "",
    problemDescription: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId,
        ...form,
        vendorId: form.vendorId || undefined,
        technicianName: form.technicianName || undefined,
        problemDescription: form.problemDescription || undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not schedule maintenance.");
      return;
    }

    const { data } = await res.json();
    router.push(`/maintenance/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        required
        value={form.maintenanceType}
        onChange={(e) => setForm((f) => ({ ...f, maintenanceType: e.target.value }))}
        placeholder="Maintenance type (e.g. Repair, Cleaning, Inspection)"
        className="w-full rounded border border-border px-2 py-1.5 text-sm"
      />
      <select
        value={form.vendorId}
        onChange={(e) => setForm((f) => ({ ...f, vendorId: e.target.value }))}
        className="w-full rounded border border-border px-2 py-1.5 text-sm"
      >
        <option value="">— No vendor (internal) —</option>
        {vendors.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      <input
        value={form.technicianName}
        onChange={(e) => setForm((f) => ({ ...f, technicianName: e.target.value }))}
        placeholder="Technician name (optional)"
        className="w-full rounded border border-border px-2 py-1.5 text-sm"
      />
      <textarea
        value={form.problemDescription}
        onChange={(e) => setForm((f) => ({ ...f, problemDescription: e.target.value }))}
        placeholder="Problem description (optional)"
        rows={2}
        className="w-full rounded border border-border px-2 py-1.5 text-sm"
      />
      {error && <p className="rounded bg-danger-soft px-2 py-1 text-xs text-danger">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
      >
        {submitting ? "Scheduling…" : "Schedule maintenance"}
      </button>
    </form>
  );
}
