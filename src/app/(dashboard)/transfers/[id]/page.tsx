import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { getTransferById, canActOnCurrentStep, getCurrentStepRule } from "@/services/transfer.service";
import { prisma } from "@/lib/prisma";
import { TransferStatusBadge } from "@/components/shared/TransferStatusBadge";
import { TransferActions } from "./TransferActions";

const APPROVER_TYPE_LABEL: Record<string, string> = {
  ROOM_PIC_SOURCE: "Source room's Primary PIC",
  ROOM_PIC_DEST: "Destination room's Primary PIC",
  ROLE: "Anyone with role",
  SPECIFIC_USER: "Specific user",
};

function formatDateTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TransferDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session, PERMISSIONS.TRANSFER_CREATE)) redirect("/dashboard");

  const transfer = await getTransferById(params.id);
  if (!transfer) notFound();

  const canViewAll = hasPermission(session, PERMISSIONS.TRANSFER_VIEW);
  const isRequester = transfer.requestedById === (session.user.id as string);
  if (!canViewAll && !isRequester) redirect("/transfers");

  const userId = session.user.id as string;
  const roleNames = (session.user as unknown as { roles: string[] }).roles ?? [];

  const [canAct, currentRule, destPic] = await Promise.all([
    transfer.status === "PENDING_APPROVAL" && hasPermission(session, PERMISSIONS.TRANSFER_APPROVE)
      ? canActOnCurrentStep(transfer.id, userId, roleNames)
      : Promise.resolve(false),
    transfer.status === "PENDING_APPROVAL" ? getCurrentStepRule(transfer.id) : Promise.resolve(null),
    prisma.roomPic.findFirst({
      where: { roomId: transfer.toRoomId, picType: "PRIMARY", isActive: true },
      include: { user: true },
    }),
  ]);

  const canManage = hasPermission(session, PERMISSIONS.TRANSFER_MANAGE);
  const canReceive =
    (transfer.status === "APPROVED" || transfer.status === "IN_TRANSIT") &&
    (canManage || (hasPermission(session, PERMISSIONS.TRANSFER_RECEIVE) && destPic?.userId === userId));
  const canCancel = (transfer.status === "DRAFT" || transfer.status === "PENDING_APPROVAL") && (isRequester || canManage);
  const canApproveHere = transfer.status === "PENDING_APPROVAL" && (canAct || canManage);

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-soft">Transfer request</p>
          <h1 className="text-xl font-semibold text-ink">
            {transfer.asset.name} <span className="font-mono text-sm text-ink-soft">{transfer.asset.assetCode}</span>
          </h1>
        </div>
        <TransferStatusBadge status={transfer.status} />
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 rounded-md border border-border bg-surface p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-ink-soft">From room</dt>
          <dd className="text-sm text-ink">{transfer.fromRoom?.name ?? "— none —"}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">To room</dt>
          <dd className="text-sm text-ink">{transfer.toRoom.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Requested by</dt>
          <dd className="text-sm text-ink">{transfer.requestedBy.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Requested at</dt>
          <dd className="text-sm text-ink">{formatDateTime(transfer.requestedAt)}</dd>
        </div>
        {transfer.reason && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-soft">Reason</dt>
            <dd className="text-sm text-ink">{transfer.reason}</dd>
          </div>
        )}
        {transfer.status === "PENDING_APPROVAL" && currentRule && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-soft">
              Waiting on step {transfer.currentApprovalStep} of {transfer.totalApprovalSteps}
            </dt>
            <dd className="text-sm text-ink">{APPROVER_TYPE_LABEL[currentRule.approverType]}</dd>
          </div>
        )}
        {transfer.status === "CANCELLED" && transfer.cancelledReason && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-soft">Cancellation reason</dt>
            <dd className="text-sm text-ink">{transfer.cancelledReason}</dd>
          </div>
        )}
      </dl>

      {transfer.approvals.length > 0 && (
        <div className="mt-4 rounded-md border border-border bg-surface p-5">
          <p className="text-sm font-medium text-ink">Approval history</p>
          <ul className="mt-2 space-y-2">
            {transfer.approvals.map((a) => (
              <li key={a.id} className="text-xs text-ink-soft">
                Step {a.stepOrder} · <span className="text-ink">{a.approver?.name ?? "—"}</span> ·{" "}
                {a.action.replace(/_/g, " ")} · {formatDateTime(a.actedAt)}
                {a.comment ? ` · "${a.comment}"` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(canApproveHere || canReceive || canCancel) && (
        <div className="mt-4 rounded-md border border-border bg-surface p-5">
          <p className="text-sm font-medium text-ink">Actions</p>
          <div className="mt-3">
            <TransferActions
              transferId={transfer.id}
              canApprove={canApproveHere}
              canReceive={canReceive}
              canCancel={canCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
