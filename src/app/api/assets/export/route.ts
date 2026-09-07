import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { exportAssetsFlat } from "@/services/asset.service";

/**
 * Returns flattened rows as JSON; the client turns this into a CSV/XLSX
 * download (via SheetJS) so the server doesn't need to generate binary
 * files itself for Phase 2.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!hasPermission(session, PERMISSIONS.ASSET_IMPORT_EXPORT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await exportAssetsFlat();
  return NextResponse.json({ data: rows });
}
