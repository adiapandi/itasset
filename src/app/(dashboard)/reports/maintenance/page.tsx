import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getMaintenanceReport, flattenMaintenance } from "@/services/report.service";
import { ReportExportBar } from "../ReportExportBar";
import { DateRangeFilterBar } from "../DateRangeFilterBar";
import { MaintenanceStatusBadge } from "@/components/shared/MaintenanceStatusBadge";

export default async function MaintenanceReportPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.REPORT_VIEW)) redirect("/dashboard");

  const rows = await getMaintenanceReport(searchParams);
  const flatRows = flattenMaintenance(rows);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Maintenance History</h1>
          <p className="mt-1 text-sm text-ink-soft">{rows.length} record(s).</p>
        </div>
        <ReportExportBar rows={flatRows} filenameBase="maintenance-history" />
      </div>

      <div className="print:hidden mt-4">
        <DateRangeFilterBar />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Asset</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Vendor</th>
              <th className="px-4 py-2 font-medium">Start date</th>
              <th className="px-4 py-2 font-medium">Cost</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  <span className="text-ink">{m.asset.name}</span>
                  <span className="ml-2 font-mono text-xs text-ink-soft">{m.asset.assetCode}</span>
                </td>
                <td className="px-4 py-2 text-ink-soft">{m.maintenanceType}</td>
                <td className="px-4 py-2 text-ink-soft">{m.vendor?.name ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">
                  {new Date(m.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-2 text-ink-soft">{m.cost ? `Rp ${m.cost.toString()}` : "—"}</td>
                <td className="px-4 py-2">
                  <MaintenanceStatusBadge status={m.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No maintenance records in this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
