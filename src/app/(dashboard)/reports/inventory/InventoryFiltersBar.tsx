"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Option {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  "AVAILABLE",
  "ASSIGNED",
  "IN_STORAGE",
  "UNDER_MAINTENANCE",
  "DAMAGED",
  "LOST",
  "STOLEN",
  "RETIRED",
  "DISPOSED",
];

export function InventoryFiltersBar({
  categories,
  departments,
  rooms,
}: {
  categories: Option[];
  departments: Option[];
  rooms: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        defaultValue={searchParams.get("categoryId") ?? ""}
        onChange={(e) => updateParam("categoryId", e.target.value)}
        className="rounded border border-border px-3 py-1.5 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded border border-border px-3 py-1.5 text-sm"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll("_", " ")}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("departmentId") ?? ""}
        onChange={(e) => updateParam("departmentId", e.target.value)}
        className="rounded border border-border px-3 py-1.5 text-sm"
      >
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("roomId") ?? ""}
        onChange={(e) => updateParam("roomId", e.target.value)}
        className="rounded border border-border px-3 py-1.5 text-sm"
      >
        <option value="">All rooms</option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
