import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { cancelTransferSchema } from "@/validators/transfer.validator";
import { cancelTransfer, getTransferById } from "@/services/transfer.service";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const userId = session.user.id as string;
  const transfer = await getTransferById(params.id);
  if (!transfer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canManage = hasPermission(session, PERMISSIONS.TRANSFER_MANAGE);
  const isRequester = transfer.requestedById === userId;
  if (!canManage && !isRequester) {
    return NextResponse.json({ error: "Only the requester can cancel this transfer." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = cancelTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const result = await cancelTransfer(params.id, userId, parsed.data.reason);
    return NextResponse.json({ data: result });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}
