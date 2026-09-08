import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getAssetById } from "@/services/asset.service";
import { getAssignmentHistory } from "@/services/assignment.service";
import { prisma } from "@/lib/prisma";
import { StatusBadge, ConditionBadge } from "@/components/shared/Badges";
import { AssignEmployeeForm } from "./AssignEmployeeForm";
import { UnassignEmployeeButton } from "./UnassignEmployeeButton";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const canViewAll = hasPermission(session, PERMISSIONS.ASSET_VIEW);
  const canViewOwn = hasPermission(session, PERMISSIONS.ASSET_VIEW_OWN);
  if (!session || (!canViewAll && !canViewOwn)) redirect("/dashboard");

  const asset = await getAssetById(params.id);
  if (!asset) notFound();

  // Employees scoped to asset.view_own may only open assets assigned to them.
  if (!canViewAll && asset.assignedUserId !== (session.user.id as string)) {
    redirect("/assets");
  }

  const canAssign = hasPermission(session, PERMISSIONS.ASSET_ASSIGN);
  const [history, users] = await Promise.all([
    getAssignmentHistory(asset.id),
    canAssign
      ? prisma.user.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  const fields: [string, string][] = [
    ["Category", asset.category.name],
    ["Model", asset.model?.name ?? "—"],
    ["Brand", asset.brand ?? "—"],
    ["Serial number", asset.serialNumber ?? "—"],
    ["Vendor", asset.vendor?.name ?? "—"],
    ["Department", asset.department?.name ?? "—"],
    ["Current room", asset.currentRoom ? `${asset.currentRoom.name} (${asset.currentRoom.building.name})` : "— unassigned —"],
    ["Accountable PIC", asset.currentPic?.name ?? "— none —"],
    ["Purchase date", formatDate(asset.purchaseDate)],
    ["Purchase price", asset.purchasePrice ? `Rp ${asset.purchasePrice.toString()}` : "—"],
    ["Warranty end", formatDate(asset.warrantyEndDate)],
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-ink-soft">{asset.assetCode}</p>
          <h1 className="text-xl font-semibold text-ink">{asset.name}</h1>
          <div className="mt-2 flex gap-2">
            <StatusBadge status={asset.status} />
            <ConditionBadge condition={asset.condition} />
          </div>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 rounded-md border border-border bg-surface p-5 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-ink-soft">{label}</dt>
            <dd className="text-sm text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {asset.notes && (
        <div className="mt-4 rounded-md border border-border bg-surface p-5">
          <p className="text-xs text-ink-soft">Notes</p>
          <p className="mt-1 text-sm text-ink">{asset.notes}</p>
        </div>
      )}

      {/* Employee assignment — deliberately separate from Current room / Accountable PIC above */}
      <div className="mt-4 rounded-md border border-border bg-surface p-5">
        <p className="text-sm font-medium text-ink">Assigned employee</p>
        <p className="mt-1 text-xs text-ink-soft">
          Who this asset is assigned to for their own use — independent from which room it
          physically sits in.
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-ink">{asset.assignedUser?.name ?? "— unassigned —"}</span>
          {canAssign && asset.assignedUser && <UnassignEmployeeButton assetId={asset.id} />}
        </div>

        {canAssign && (
          <div className="mt-4 border-t border-border pt-4">
            <AssignEmployeeForm assetId={asset.id} users={users} />
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              Assignment history
            </p>
            <ul className="mt-2 space-y-2">
              {history.map((h) => (
                <li key={h.id} className="text-xs text-ink-soft">
                  <span className="text-ink">{h.user?.name ?? "—"}</span>
                  {" · "}
                  {formatDateTime(h.startedAt)} → {h.endedAt ? formatDateTime(h.endedAt) : "present"}
                  {h.reason ? ` · ${h.reason}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-ink-soft">
        Room movement history and QR labels arrive in Phase 5–6.
      </p>
    </div>
  );
}
