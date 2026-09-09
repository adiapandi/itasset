import { NextResponse } from "next/server";
import { withPermission } from "@/middleware/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { createTransferSchema } from "@/validators/transfer.validator";
import { createTransferRequest } from "@/services/transfer.service";

export const POST = withPermission(PERMISSIONS.TRANSFER_CREATE, async (req, session) => {
  const body = await req.json();
  const parsed = createTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const transfer = await createTransferRequest(parsed.data, session.user.id as string);
  return NextResponse.json({ data: transfer }, { status: 201 });
});
