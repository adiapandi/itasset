import { NextResponse } from "next/server";
import { withPermission } from "@/middleware/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { createRoomSchema } from "@/validators/room.validator";
import { createRoom, listRooms } from "@/services/room.service";

export const GET = withPermission(PERMISSIONS.ROOM_VIEW, async (req) => {
  const { searchParams } = new URL(req.url);
  const rooms = await listRooms({
    buildingId: searchParams.get("buildingId") ?? undefined,
    departmentId: searchParams.get("departmentId") ?? undefined,
  });
  return NextResponse.json({ data: rooms });
});

export const POST = withPermission(PERMISSIONS.ROOM_MANAGE, async (req, session) => {
  const body = await req.json();
  const parsed = createRoomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const room = await createRoom(parsed.data, session.user.id as string);
  return NextResponse.json({ data: room }, { status: 201 });
});
