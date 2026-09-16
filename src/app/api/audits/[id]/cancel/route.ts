import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { cancelAuditSession } from "@/services/audit.service";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.AUDIT_MANAGE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await cancelAuditSession(params.id, session.user.id as string);
    return NextResponse.json({ data: result });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}
