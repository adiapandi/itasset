import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getAuditReport } from "@/services/report.service";
import { ReportExportBar } from "../ReportExportBar";
import { AuditSessionStatusBadge } from "@/components/shared/AuditBadges";

export default async function AuditReportPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.REPORT_VIEW)) redirect("/dashboard");

  const sessions = await getAuditReport();

  const flatRows = sessions.map((s) => ({
    Session: s.name,
    Room: s.room.name,
    "Started By": s.startedBy.name,
    Status: s.status,
    Total: String(s.total),
    Verified: String(s.counts.VERIFIED ?? 0),
    "Wrong Location": String(s.counts.WRONG_LOCATION ?? 0),
    Damaged: String(s.counts.DAMAGED ?? 0),
    Missing: String(s.counts.MISSING ?? 0),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Audit Summary</h1>
        <ReportExportBar rows={flatRows} filenameBase="audit-summary" />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Session</th>
              <th className="px-4 py-2 font-medium">Room</th>
              <th className="px-4 py-2 font-medium">Verified</th>
              <th className="px-4 py-2 font-medium">Wrong loc.</th>
              <th className="px-4 py-2 font-medium">Damaged</th>
              <th className="px-4 py-2 font-medium">Missing</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  <Link href={`/audits/${s.id}`} className="text-accent hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-soft">{s.room.name}</td>
                <td className="px-4 py-2 text-ink-soft">{s.counts.VERIFIED ?? 0} / {s.total}</td>
                <td className="px-4 py-2 text-ink-soft">{s.counts.WRONG_LOCATION ?? 0}</td>
                <td className="px-4 py-2 text-ink-soft">{s.counts.DAMAGED ?? 0}</td>
                <td className="px-4 py-2 text-ink-soft">{s.counts.MISSING ?? 0}</td>
                <td className="px-4 py-2">
                  <AuditSessionStatusBadge status={s.status} />
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No audit sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
