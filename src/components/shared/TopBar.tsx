"use client";

import { signOut } from "next-auth/react";

export function TopBar({ userName }: { userName: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <span className="text-sm text-ink-soft">Welcome back, {userName}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-sunken"
      >
        Sign out
      </button>
    </header>
  );
}
