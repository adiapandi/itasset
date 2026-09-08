"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Building {
  id: string;
  name: string;
}
interface Department {
  id: string;
  name: string;
}

const ROOM_TYPES = [
  "OFFICE",
  "MEETING_ROOM",
  "SERVER_ROOM",
  "WAREHOUSE",
  "STORAGE_ROOM",
  "RECEPTION",
  "TRAINING_ROOM",
  "OTHER",
];

export function NewRoomForm({ buildings, departments }: { buildings: Building[]; departments: Department[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    roomCode: "",
    name: "",
    buildingId: "",
    floor: "",
    departmentId: "",
    roomType: "OFFICE",
    capacity: "",
    description: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        departmentId: form.departmentId || undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not create room.");
      return;
    }

    setForm({
      roomCode: "",
      name: "",
      buildingId: "",
      floor: "",
      departmentId: "",
      roomType: "OFFICE",
      capacity: "",
      description: "",
    });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft"
      >
        Add room
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-surface p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Room code</label>
          <input
            required
            value={form.roomCode}
            onChange={(e) => setForm((f) => ({ ...f, roomCode: e.target.value.toUpperCase() }))}
            className="w-full rounded border border-border px-3 py-2 text-sm font-mono uppercase"
            placeholder="SRV-01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
            placeholder="IT Server Room"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Building</label>
          <select
            required
            value={form.buildingId}
            onChange={(e) => setForm((f) => ({ ...f, buildingId: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          >
            <option value="">Select building…</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Floor</label>
          <input
            value={form.floor}
            onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Department</label>
          <select
            value={form.departmentId}
            onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
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
          <label className="block text-sm font-medium text-ink mb-1">Room type</label>
          <select
            value={form.roomType}
            onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          >
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Capacity</label>
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-1">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
          {submitting ? "Saving…" : "Save room"}
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
