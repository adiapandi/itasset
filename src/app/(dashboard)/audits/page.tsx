import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { listAuditSessions } from "@/services/audit.service";
import { AuditSessionStatusBadge } from "@/components/shared/AuditBadges";

export default async function AuditsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.AUDIT_VIEW)) redirect("/dashboard");

  const sessions = await listAuditSessions();
  const canManage = hasPermission(session, PERMISSIONS.AUDIT_MANAGE);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Audit Sessions</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Room-scoped stock-take: scan every asset actually present, compare against what the
            system expects to be there.
          </p>
        </div>
        {canManage && (
          <Link href="/audits/new" className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-soft">
            Start audit
          </Link>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Session</th>
              <th className="px-4 py-2 font-medium">Room</th>
              <th className="px-4 py-2 font-medium">Started by</th>
              <th className="px-4 py-2 font-medium">Items</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-sunken">
                <td className="px-4 py-2">
                  <Link href={`/audits/${s.id}`} className="text-accent hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-soft">{s.room.name}</td>
                <td className="px-4 py-2 text-ink-soft">{s.startedBy.name}</td>
                <td className="px-4 py-2 text-ink-soft">{s._count.items}</td>
                <td className="px-4 py-2">
                  <AuditSessionStatusBadge status={s.status} />
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-soft">
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
