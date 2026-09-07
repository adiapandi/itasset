"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Role {
  id: string;
  name: string;
}
interface Department {
  id: string;
  name: string;
}

export function NewUserForm({ roles, departments }: { roles: Role[]; departments: Department[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
    roleIds: [] as string[],
  });

  function toggleRole(id: string) {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(id) ? f.roleIds.filter((r) => r !== id) : [...f.roleIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        departmentId: form.departmentId || undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Could not create user. Check the fields and try again.");
      return;
    }

    setForm({ name: "", email: "", password: "", departmentId: "", roleIds: [] });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft"
      >
        Add user
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-md border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Temporary password</label>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
      </div>

      <div>
        <p className="block text-sm font-medium text-ink mb-1">Roles</p>
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <label
              key={r.id}
              className={
                "cursor-pointer rounded border px-2 py-1 text-xs " +
                (form.roleIds.includes(r.id)
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-ink-soft")
              }
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={form.roleIds.includes(r.id)}
                onChange={() => toggleRole(r.id)}
              />
              {r.name}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="rounded bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create user"}
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
