import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getWarrantyReport } from "@/services/report.service";
import { ReportExportBar } from "../ReportExportBar";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function WarrantyReportPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.REPORT_VIEW)) redirect("/dashboard");

  const { expired, expiringSoon, active } = await getWarrantyReport();

  const flatRows = [
    ...expired.map((a) => ({ Group: "Expired", "Asset Code": a.assetCode, Name: a.name, "Warranty End": formatDate(a.warrantyEndDate) })),
    ...expiringSoon.map((a) => ({ Group: "Expiring within 90 days", "Asset Code": a.assetCode, Name: a.name, "Warranty End": formatDate(a.warrantyEndDate) })),
    ...active.map((a) => ({ Group: "Active", "Asset Code": a.assetCode, Name: a.name, "Warranty End": formatDate(a.warrantyEndDate) })),
  ];

  const groups = [
    { title: "Expired", items: expired, style: "text-danger" },
    { title: "Expiring within 90 days", items: expiringSoon, style: "text-warn" },
    { title: "Active", items: active, style: "text-accent" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Warranty</h1>
        <ReportExportBar rows={flatRows} filenameBase="warranty-report" />
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div key={g.title} className="overflow-hidden rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border bg-surface-sunken px-4 py-2">
              <p className={`text-sm font-medium ${g.style}`}>{g.title}</p>
              <p className="text-xs text-ink-soft">{g.items.length} asset(s)</p>
            </div>
            {g.items.length > 0 ? (
              <table className="w-full text-left text-sm">
                <tbody>
                  {g.items.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-1.5 font-mono text-xs text-ink-soft">{a.assetCode}</td>
                      <td className="px-4 py-1.5 text-ink">{a.name}</td>
                      <td className="px-4 py-1.5 text-ink-soft">{a.category.name}</td>
                      <td className="px-4 py-1.5 text-ink-soft">{formatDate(a.warrantyEndDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-3 text-sm text-ink-soft">None.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
