import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getTransferReport, flattenTransfers } from "@/services/report.service";
import { ReportExportBar } from "../ReportExportBar";
import { DateRangeFilterBar } from "../DateRangeFilterBar";
import { TransferStatusBadge } from "@/components/shared/TransferStatusBadge";

export default async function TransferReportPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.REPORT_VIEW)) redirect("/dashboard");

  const rows = await getTransferReport(searchParams);
  const flatRows = flattenTransfers(rows);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Transfer History</h1>
          <p className="mt-1 text-sm text-ink-soft">{rows.length} transfer(s).</p>
        </div>
        <ReportExportBar rows={flatRows} filenameBase="transfer-history" />
      </div>

      <div className="print:hidden mt-4">
        <DateRangeFilterBar />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Asset</th>
              <th className="px-4 py-2 font-medium">From → To</th>
              <th className="px-4 py-2 font-medium">Requested by</th>
              <th className="px-4 py-2 font-medium">Requested at</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  <span className="text-ink">{t.asset.name}</span>
                  <span className="ml-2 font-mono text-xs text-ink-soft">{t.asset.assetCode}</span>
                </td>
                <td className="px-4 py-2 text-ink-soft">
                  {t.fromRoom?.name ?? "— none —"} → {t.toRoom.name}
                </td>
                <td className="px-4 py-2 text-ink-soft">{t.requestedBy.name}</td>
                <td className="px-4 py-2 text-ink-soft">
                  {new Date(t.requestedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-2">
                  <TransferStatusBadge status={t.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No transfers in this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
