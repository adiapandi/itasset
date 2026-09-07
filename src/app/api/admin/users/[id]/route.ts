import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { updateUserSchema } from "@/validators/user.validator";
import { deactivateUser, getUserById, updateUser } from "@/services/user.service";

// [id] dynamic-segment routes take `params` as Next's second handler arg,
// so these use a direct session check rather than the withPermission()
// wrapper (which is shaped for param-less routes like the collection route).

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.USER_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getUserById(params.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: user });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.USER_EDIT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const user = await updateUser(params.id, parsed.data, session.user.id as string);
  return NextResponse.json({ data: user });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.USER_DELETE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deactivateUser(params.id, session.user.id as string);
  return NextResponse.json({ data: { id: params.id, deactivated: true } });
}
