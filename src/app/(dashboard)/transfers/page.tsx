import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { listTransfers } from "@/services/transfer.service";
import { TransferStatusBadge } from "@/components/shared/TransferStatusBadge";

export default async function TransfersPage() {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.TRANSFER_CREATE)) redirect("/dashboard");

  const canViewAll = hasPermission(session, PERMISSIONS.TRANSFER_VIEW);
  const transfers = await listTransfers(
    canViewAll ? {} : { requestedById: session.user.id as string }
  );

  const canApprove = hasPermission(session, PERMISSIONS.TRANSFER_APPROVE);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{canViewAll ? "Transfers" : "My Transfer Requests"}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Room-to-room asset moves go through an approval workflow before they take effect.
          </p>
        </div>
        {canApprove && (
          <Link href="/transfers/approvals" className="text-sm text-accent hover:underline">
            Pending my approval →
          </Link>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Asset</th>
              <th className="px-4 py-2 font-medium">From → To</th>
              <th className="px-4 py-2 font-medium">Requested by</th>
              <th className="px-4 py-2 font-medium">Step</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface-sunken">
                <td className="px-4 py-2">
                  <Link href={`/transfers/${t.id}`} className="text-accent hover:underline">
                    {t.asset.name}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-ink-soft">{t.asset.assetCode}</span>
                </td>
                <td className="px-4 py-2 text-ink-soft">
                  {t.fromRoom?.name ?? "— none —"} → {t.toRoom.name}
                </td>
                <td className="px-4 py-2 text-ink-soft">{t.requestedBy.name}</td>
                <td className="px-4 py-2 text-ink-soft">
                  {t.status === "PENDING_APPROVAL" ? `${t.currentApprovalStep} / ${t.totalApprovalSteps}` : "—"}
                </td>
                <td className="px-4 py-2">
                  <TransferStatusBadge status={t.status} />
                </td>
              </tr>
            ))}
            {transfers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-soft">
                  No transfer requests yet. Start one from an asset&apos;s detail page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
