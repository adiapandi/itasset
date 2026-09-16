import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getAuditSessionById } from "@/services/audit.service";
import { AuditResultBadge, AuditSessionStatusBadge } from "@/components/shared/AuditBadges";
import { ScanForm } from "./ScanForm";
import { SessionActions } from "./SessionActions";

export default async function AuditSessionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.AUDIT_VIEW)) redirect("/dashboard");

  const auditSession = await getAuditSessionById(params.id);
  if (!auditSession) notFound();

  const canManage = hasPermission(session, PERMISSIONS.AUDIT_MANAGE);

  const counts = auditSession.items.reduce(
    (acc, item) => {
      const key = item.result ?? "PENDING";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-soft">Audit session</p>
          <h1 className="text-xl font-semibold text-ink">{auditSession.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {auditSession.room.name} ({auditSession.room.building.name})
          </p>
        </div>
        <AuditSessionStatusBadge status={auditSession.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-surface-sunken px-2 py-1 text-ink-soft">Expected: {auditSession.items.length}</span>
        <span className="rounded bg-accent-soft px-2 py-1 text-accent">Verified: {counts.VERIFIED ?? 0}</span>
        <span className="rounded bg-warn-soft px-2 py-1 text-warn">Wrong location: {counts.WRONG_LOCATION ?? 0}</span>
        <span className="rounded bg-danger-soft px-2 py-1 text-danger">Damaged: {counts.DAMAGED ?? 0}</span>
        <span className="rounded bg-danger-soft px-2 py-1 text-danger">Missing: {counts.MISSING ?? 0}</span>
        <span className="rounded bg-surface-sunken px-2 py-1 text-ink-soft">Not scanned yet: {counts.PENDING ?? 0}</span>
      </div>

      {canManage && auditSession.status === "IN_PROGRESS" && (
        <div className="mt-4 rounded-md border border-border bg-surface p-4">
          <p className="text-sm font-medium text-ink">Scan an asset</p>
          <p className="mt-1 text-xs text-ink-soft">
            Type or scan an asset code (a physical barcode scanner acts like a keyboard + Enter).
          </p>
          <div className="mt-3">
            <ScanForm sessionId={auditSession.id} />
          </div>
        </div>
      )}

      {canManage && auditSession.status === "IN_PROGRESS" && (
        <div className="mt-4">
          <SessionActions sessionId={auditSession.id} />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Asset</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Scanned by</th>
              <th className="px-4 py-2 font-medium">Scanned at</th>
              <th className="px-4 py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {auditSession.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  <span className="text-ink">{item.asset.name}</span>
                  <span className="ml-2 font-mono text-xs text-ink-soft">{item.asset.assetCode}</span>
                </td>
                <td className="px-4 py-2 text-ink-soft">{item.asset.category.name}</td>
                <td className="px-4 py-2 text-ink-soft">{item.scannedBy?.name ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">
                  {item.scannedAt
                    ? new Date(item.scannedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  <AuditResultBadge result={item.result} />
                </td>
              </tr>
            ))}
            {auditSession.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No assets were expected in this room when the audit started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
