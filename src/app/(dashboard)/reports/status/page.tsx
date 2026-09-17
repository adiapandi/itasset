import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getStatusReport, flattenStatusReport } from "@/services/report.service";
import { ReportExportBar } from "../ReportExportBar";
import { StatusBadge } from "@/components/shared/Badges";

export default async function StatusReportPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.REPORT_VIEW)) redirect("/dashboard");

  const rows = await getStatusReport();
  const flatRows = flattenStatusReport(rows);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Lost / Damaged / Retired</h1>
          <p className="mt-1 text-sm text-ink-soft">{rows.length} asset(s) currently in a non-normal status.</p>
        </div>
        <ReportExportBar rows={flatRows} filenameBase="lost-damaged-retired" />
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
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Updated</th>
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
                <td className="px-4 py-2">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-2 text-ink-soft">
                  {new Date(a.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No assets in a non-normal status. 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
