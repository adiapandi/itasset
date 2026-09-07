import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { createAssetSchema } from "@/validators/asset.validator";
import { createAsset, listAssets } from "@/services/asset.service";
import type { AssetCondition, AssetStatus } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.ASSET_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const result = await listAssets({
    search: searchParams.get("search") ?? undefined,
    status: (searchParams.get("status") as AssetStatus) ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    departmentId: searchParams.get("departmentId") ?? undefined,
    condition: (searchParams.get("condition") as AssetCondition) ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
  });

  return NextResponse.json({ data: result });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.ASSET_CREATE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const asset = await createAsset(parsed.data, session.user.id as string);
  return NextResponse.json({ data: asset }, { status: 201 });
}
