import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getInventoryReport, flattenInventory } from "@/services/report.service";
import { prisma } from "@/lib/prisma";
import { ReportExportBar } from "../ReportExportBar";
import { StatusBadge, ConditionBadge } from "@/components/shared/Badges";
import { InventoryFiltersBar } from "./InventoryFiltersBar";

export default async function InventoryReportPage({
  searchParams,
}: {
  searchParams: { categoryId?: string; status?: string; departmentId?: string; roomId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.REPORT_VIEW)) redirect("/dashboard");

  const [rows, categories, departments, rooms] = await Promise.all([
    getInventoryReport(searchParams),
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.room.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);

  const flatRows = flattenInventory(rows);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Asset Inventory</h1>
          <p className="mt-1 text-sm text-ink-soft">{rows.length} asset(s) match these filters.</p>
        </div>
        <ReportExportBar rows={flatRows} filenameBase="asset-inventory" />
      </div>

      <div className="print:hidden mt-4">
        <InventoryFiltersBar categories={categories} departments={departments} rooms={rooms} />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Department</th>
              <th className="px-4 py-2 font-medium">Room</th>
              <th className="px-4 py-2 font-medium">Assigned to</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Condition</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-mono text-xs text-ink-soft">{a.assetCode}</td>
                <td className="px-4 py-2 text-ink">{a.name}</td>
                <td className="px-4 py-2 text-ink-soft">{a.category.name}</td>
                <td className="px-4 py-2 text-ink-soft">{a.department?.name ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{a.currentRoom?.name ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{a.assignedUser?.name ?? "—"}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-2">
                  <ConditionBadge condition={a.condition} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No assets match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
