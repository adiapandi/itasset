"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UnassignPicButton({ roomPicId }: { roomPicId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    if (!confirm("Unassign this PIC from the room?")) return;
    setSubmitting(true);
    await fetch(`/api/room-pics/${roomPicId}`, { method: "DELETE" });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={submitting}
      className="text-xs text-danger hover:underline disabled:opacity-60"
    >
      Remove
    </button>
  );
}
