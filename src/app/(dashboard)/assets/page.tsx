import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { listAssets } from "@/services/asset.service";
import { prisma } from "@/lib/prisma";
import { StatusBadge, ConditionBadge } from "@/components/shared/Badges";
import { AssetFiltersBar } from "./AssetFiltersBar";
import { ImportExportBar } from "./ImportExportBar";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; categoryId?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.ASSET_VIEW)) {
    redirect("/dashboard");
  }

  const [result, categories] = await Promise.all([
    listAssets({
      search: searchParams.search,
      status: searchParams.status as never,
      categoryId: searchParams.categoryId,
      page: searchParams.page ? Number(searchParams.page) : undefined,
    }),
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const canCreate = hasPermission(session, PERMISSIONS.ASSET_CREATE);
  const canImportExport = hasPermission(session, PERMISSIONS.ASSET_IMPORT_EXPORT);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Assets</h1>
          <p className="mt-1 text-sm text-ink-soft">{result.total} asset(s) total.</p>
        </div>
        <div className="flex gap-2">
          {canImportExport && <ImportExportBar />}
          {canCreate && (
            <Link
              href="/assets/new"
              className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft"
            >
              Add asset
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4">
        <AssetFiltersBar categories={categories} />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Asset Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Serial No.</th>
              <th className="px-4 py-2 font-medium">Room</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Condition</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface-sunken">
                <td className="px-4 py-2">
                  <Link href={`/assets/${a.id}`} className="font-mono text-xs text-accent hover:underline">
                    {a.assetCode}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink">{a.name}</td>
                <td className="px-4 py-2 text-ink-soft">{a.category.name}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-soft">{a.serialNumber ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{a.currentRoom?.name ?? "—"}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-2">
                  <ConditionBadge condition={a.condition} />
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No assets match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {result.totalPages > 1 && (
        <div className="mt-3 flex gap-2 text-sm text-ink-soft">
          Page {result.page} of {result.totalPages}
        </div>
      )}
    </div>
  );
}
