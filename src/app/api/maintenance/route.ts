import { NextResponse } from "next/server";
import { withPermission } from "@/middleware/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { createMaintenanceSchema } from "@/validators/maintenance.validator";
import { createMaintenance } from "@/services/maintenance.service";

export const POST = withPermission(PERMISSIONS.MAINTENANCE_MANAGE, async (req, session) => {
  const body = await req.json();
  const parsed = createMaintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const record = await createMaintenance(parsed.data, session.user.id as string);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
});
