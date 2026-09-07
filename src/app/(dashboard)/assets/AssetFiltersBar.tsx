"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

interface Category {
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

export function AssetFiltersBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", search);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={handleSearchSubmit} className="flex">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code, name, or serial…"
          className="w-64 rounded-l border border-border px-3 py-1.5 text-sm"
        />
        <button className="rounded-r border border-l-0 border-border bg-surface-sunken px-3 py-1.5 text-sm text-ink-soft hover:text-ink">
          Search
        </button>
      </form>

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
    </div>
  );
}
