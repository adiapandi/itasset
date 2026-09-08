import { NextResponse } from "next/server";
import { withPermission } from "@/middleware/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { createBuildingSchema } from "@/validators/room.validator";
import { createBuilding, listBuildings } from "@/services/room.service";

export const GET = withPermission(PERMISSIONS.ROOM_VIEW, async () => {
  const buildings = await listBuildings();
  return NextResponse.json({ data: buildings });
});

export const POST = withPermission(PERMISSIONS.ROOM_MANAGE, async (req, session) => {
  const body = await req.json();
  const parsed = createBuildingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const building = await createBuilding(parsed.data, session.user.id as string);
  return NextResponse.json({ data: building }, { status: 201 });
});
