"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UnassignEmployeeButton({ assetId }: { assetId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    if (!confirm("Unassign this asset from the current employee?")) return;
    setSubmitting(true);
    await fetch(`/api/assets/${assetId}/unassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={submitting}
      className="text-xs text-danger hover:underline disabled:opacity-60"
    >
      Unassign
    </button>
  );
}
