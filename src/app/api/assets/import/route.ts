import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { importAssets, type AssetImportRow } from "@/services/asset.service";

/**
 * Expects { rows: AssetImportRow[] } already parsed client-side.
 * Keeping parsing on the client (papaparse/SheetJS) means this endpoint
 * stays a plain JSON API and doesn't need multipart handling.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.ASSET_IMPORT_EXPORT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const rows = body?.rows as AssetImportRow[] | undefined;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 422 });
  }

  const result = await importAssets(rows, session.user.id as string);
  return NextResponse.json({ data: result });
}
