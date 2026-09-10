"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft"
    >
      Print
    </button>
  );
}
