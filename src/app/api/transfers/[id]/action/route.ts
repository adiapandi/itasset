import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { transferActionSchema } from "@/validators/transfer.validator";
import { actOnTransfer, canActOnCurrentStep } from "@/services/transfer.service";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = transferActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const userId = session.user.id as string;
  const roleNames = (session.user as unknown as { roles: string[] }).roles ?? [];

  // Either eligible for the transfer's current step specifically, or holds
  // the blanket transfer.manage override (Asset Administrator / Super Admin).
  const eligible =
    hasPermission(session, PERMISSIONS.TRANSFER_MANAGE) ||
    (hasPermission(session, PERMISSIONS.TRANSFER_APPROVE) &&
      (await canActOnCurrentStep(params.id, userId, roleNames)));

  if (!eligible) {
    return NextResponse.json({ error: "You are not the approver for this step." }, { status: 403 });
  }

  try {
    const transfer = await actOnTransfer(params.id, parsed.data.action, userId, parsed.data.comment);
    return NextResponse.json({ data: transfer });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}
