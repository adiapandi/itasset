"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

export function DateRangeFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set("from", from);
    else params.delete("from");
    if (to) params.set("to", to);
    else params.delete("to");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-ink-soft">
        From{" "}
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="ml-1 rounded border border-border px-2 py-1 text-sm"
        />
      </label>
      <label className="text-sm text-ink-soft">
        To{" "}
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="ml-1 rounded border border-border px-2 py-1 text-sm"
        />
      </label>
      <button type="submit" className="rounded border border-border px-3 py-1.5 text-sm text-ink hover:bg-surface-sunken">
        Apply
      </button>
    </form>
  );
}
