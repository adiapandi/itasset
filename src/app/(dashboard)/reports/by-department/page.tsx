import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getByDepartmentReport } from "@/services/report.service";
import { ReportExportBar } from "../ReportExportBar";

export default async function ByDepartmentReportPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.REPORT_VIEW)) redirect("/dashboard");

  const { departments, unassigned } = await getByDepartmentReport();

  const flatRows = [
    ...departments.flatMap((d) =>
      d.assets.map((a) => ({
        Department: d.name,
        "Asset Code": a.assetCode,
        Name: a.name,
        Category: a.category.name,
        Room: a.currentRoom?.name ?? "",
        Status: a.status,
      }))
    ),
    ...unassigned.map((a) => ({
      Department: "— None —",
      "Asset Code": a.assetCode,
      Name: a.name,
      Category: a.category.name,
      Room: a.currentRoom?.name ?? "",
      Status: a.status,
    })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Assets by Department</h1>
        <ReportExportBar rows={flatRows} filenameBase="assets-by-department" />
      </div>

      <div className="mt-4 space-y-4">
        {departments.map((d) => (
          <div key={d.id} className="overflow-hidden rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border bg-surface-sunken px-4 py-2">
              <p className="text-sm font-medium text-ink">{d.name}</p>
              <p className="text-xs text-ink-soft">{d.assets.length} asset(s)</p>
            </div>
            {d.assets.length > 0 ? (
              <table className="w-full text-left text-sm">
                <tbody>
                  {d.assets.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-1.5 font-mono text-xs text-ink-soft">{a.assetCode}</td>
                      <td className="px-4 py-1.5 text-ink">{a.name}</td>
                      <td className="px-4 py-1.5 text-ink-soft">{a.category.name}</td>
                      <td className="px-4 py-1.5 text-ink-soft">{a.currentRoom?.name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-3 text-sm text-ink-soft">No assets.</p>
            )}
          </div>
        ))}

        {unassigned.length > 0 && (
          <div className="overflow-hidden rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border bg-surface-sunken px-4 py-2">
              <p className="text-sm font-medium text-ink">— No department —</p>
              <p className="text-xs text-ink-soft">{unassigned.length} asset(s)</p>
            </div>
            <table className="w-full text-left text-sm">
              <tbody>
                {unassigned.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-1.5 font-mono text-xs text-ink-soft">{a.assetCode}</td>
                    <td className="px-4 py-1.5 text-ink">{a.name}</td>
                    <td className="px-4 py-1.5 text-ink-soft">{a.category.name}</td>
                    <td className="px-4 py-1.5 text-ink-soft">{a.currentRoom?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
