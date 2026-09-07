import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { updateAssetSchema } from "@/validators/asset.validator";
import { deleteAsset, getAssetById, updateAsset } from "@/services/asset.service";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.ASSET_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const asset = await getAssetById(params.id);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: asset });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.ASSET_EDIT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const asset = await updateAsset(params.id, parsed.data, session.user.id as string);
  return NextResponse.json({ data: asset });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.ASSET_DELETE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteAsset(params.id, session.user.id as string);
  return NextResponse.json({ data: { id: params.id, deleted: true } });
}
