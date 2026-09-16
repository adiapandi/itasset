import { NextResponse } from "next/server";
import { withPermission } from "@/middleware/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { createAuditSessionSchema } from "@/validators/audit.validator";
import { createAuditSession } from "@/services/audit.service";

export const POST = withPermission(PERMISSIONS.AUDIT_MANAGE, async (req, session) => {
  const body = await req.json();
  const parsed = createAuditSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const auditSession = await createAuditSession(parsed.data, session.user.id as string);
  return NextResponse.json({ data: auditSession }, { status: 201 });
});
