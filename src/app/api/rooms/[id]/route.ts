import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { updateRoomSchema } from "@/validators/room.validator";
import { getRoomById, updateRoom } from "@/services/room.service";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.ROOM_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const room = await getRoomById(params.id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: room });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.ROOM_MANAGE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateRoomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const room = await updateRoom(params.id, parsed.data, session.user.id as string);
  return NextResponse.json({ data: room });
}
