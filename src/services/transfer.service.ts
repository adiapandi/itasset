import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "./audit-log.service";
import type { ApprovalWorkflowRule } from "@prisma/client";

const ACTIVE_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_TRANSIT"] as const;

/**
 * Resolves the ordered list of approval steps for a category: category-
 * specific rules first, falling back to the categoryId=null default chain,
 * falling back further to a single hardcoded "destination PIC approves"
 * step if nothing has been configured at all — so transfers are never
 * completely blocked just because an admin hasn't set up workflow rules yet.
 *
 * ROOM_PIC_SOURCE steps are dropped when the asset has no current room
 * (nothing to ask a "source PIC" about), and the remaining steps are
 * re-sequenced 1..N.
 */
async function resolveApprovalSteps(
  categoryId: string,
  hasSourceRoom: boolean
): Promise<Pick<ApprovalWorkflowRule, "approverType" | "roleId" | "specificUserId">[]> {
  let rules = await prisma.approvalWorkflowRule.findMany({
    where: { categoryId },
    orderBy: { stepOrder: "asc" },
  });

  if (rules.length === 0) {
    rules = await prisma.approvalWorkflowRule.findMany({
      where: { categoryId: null },
      orderBy: { stepOrder: "asc" },
    });
  }

  let steps = rules.map((r) => ({
    approverType: r.approverType,
    roleId: r.roleId,
    specificUserId: r.specificUserId,
  }));

  if (!hasSourceRoom) {
    steps = steps.filter((s) => s.approverType !== "ROOM_PIC_SOURCE");
  }

  if (steps.length === 0) {
    steps = [{ approverType: "ROOM_PIC_DEST", roleId: null, specificUserId: null }];
  }

  return steps;
}

export interface CreateTransferInput {
  assetId: string;
  toRoomId: string;
  reason?: string;
}

export async function createTransferRequest(input: CreateTransferInput, requesterId: string) {
  const asset = await prisma.asset.findUniqueOrThrow({
    where: { id: input.assetId },
    include: { category: true },
  });

  if (asset.currentRoomId === input.toRoomId) {
    throw httpError(422, "Asset is already located in that room.");
  }

  const existingActive = await prisma.assetTransfer.findFirst({
    where: { assetId: input.assetId, status: { in: [...ACTIVE_STATUSES] } },
  });
  if (existingActive) {
    throw httpError(409, "This asset already has a pending transfer in progress.");
  }

  const steps = await resolveApprovalSteps(asset.categoryId, !!asset.currentRoomId);

  const transfer = await prisma.assetTransfer.create({
    data: {
      assetId: input.assetId,
      fromRoomId: asset.currentRoomId,
      toRoomId: input.toRoomId,
      requestedById: requesterId,
      reason: input.reason,
      status: "PENDING_APPROVAL",
      currentApprovalStep: 1,
      totalApprovalSteps: steps.length,
    },
  });

  await recordAuditLog({
    userId: requesterId,
    action: "transfer.create",
    entityType: "AssetTransfer",
    entityId: transfer.id,
    newValue: { assetId: input.assetId, fromRoomId: asset.currentRoomId, toRoomId: input.toRoomId },
  });

  return transfer;
}

export async function getTransferById(id: string) {
  return prisma.assetTransfer.findUnique({
    where: { id },
    include: {
      asset: { include: { category: true } },
      fromRoom: true,
      toRoom: true,
      requestedBy: true,
      approvals: { include: { approver: true }, orderBy: { actedAt: "asc" } },
    },
  });
}

export async function listTransfers(filters: { requestedById?: string; status?: string }) {
  return prisma.assetTransfer.findMany({
    where: {
      requestedById: filters.requestedById,
      status: (filters.status as never) || undefined,
    },
    include: { asset: true, fromRoom: true, toRoom: true, requestedBy: true },
    orderBy: { requestedAt: "desc" },
  });
}

/**
 * Returns the current step's rule for a transfer (re-derived live from
 * ApprovalWorkflowRule, not snapshotted — see resolveApprovalSteps).
 * Used both to render "who can approve this" and to authorize actions.
 */
export async function getCurrentStepRule(transferId: string) {
  const transfer = await prisma.assetTransfer.findUniqueOrThrow({
    where: { id: transferId },
    include: { asset: true },
  });
  const steps = await resolveApprovalSteps(transfer.asset.categoryId, !!transfer.fromRoomId);
  return steps[transfer.currentApprovalStep - 1] ?? null;
}

/** Whether the given user is eligible to act on the transfer's current step. */
export async function canActOnCurrentStep(
  transferId: string,
  userId: string,
  userRoleNames: string[]
): Promise<boolean> {
  const transfer = await prisma.assetTransfer.findUniqueOrThrow({ where: { id: transferId } });
  const rule = await getCurrentStepRule(transferId);
  if (!rule) return false;

  switch (rule.approverType) {
    case "SPECIFIC_USER":
      return rule.specificUserId === userId;
    case "ROLE": {
      if (!rule.roleId) return false;
      const role = await prisma.role.findUnique({ where: { id: rule.roleId } });
      return !!role && userRoleNames.includes(role.name);
    }
    case "ROOM_PIC_SOURCE":
      return transfer.fromRoomId ? isPrimaryPic(userId, transfer.fromRoomId) : false;
    case "ROOM_PIC_DEST":
      return isPrimaryPic(userId, transfer.toRoomId);
    default:
      return false;
  }
}

async function isPrimaryPic(userId: string, roomId: string): Promise<boolean> {
  const pic = await prisma.roomPic.findFirst({
    where: { roomId, userId, picType: "PRIMARY", isActive: true },
  });
  return !!pic;
}

/**
 * Approve / reject / request-revision on the transfer's CURRENT step only —
 * callers must have already checked canActOnCurrentStep (or hold the
 * transfer.manage override) before calling this.
 */
export async function actOnTransfer(
  transferId: string,
  action: "APPROVED" | "REJECTED" | "REVISION_REQUESTED",
  actorUserId: string,
  comment: string | undefined
) {
  const transfer = await prisma.assetTransfer.findUniqueOrThrow({ where: { id: transferId } });

  if (transfer.status !== "PENDING_APPROVAL") {
    throw httpError(409, `Cannot act on a transfer in status ${transfer.status}.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.transferApproval.create({
      data: {
        transferId,
        stepOrder: transfer.currentApprovalStep,
        approverId: actorUserId,
        action,
        comment,
      },
    });

    if (action === "REJECTED") {
      return tx.assetTransfer.update({
        where: { id: transferId },
        data: { status: "REJECTED", decidedAt: new Date() },
      });
    }

    if (action === "REVISION_REQUESTED") {
      return tx.assetTransfer.update({
        where: { id: transferId },
        data: { status: "DRAFT", currentApprovalStep: 1 },
      });
    }

    // APPROVED
    const isLastStep = transfer.currentApprovalStep >= transfer.totalApprovalSteps;
    return tx.assetTransfer.update({
      where: { id: transferId },
      data: isLastStep
        ? { status: "APPROVED", decidedAt: new Date() }
        : { currentApprovalStep: transfer.currentApprovalStep + 1 },
    });
  });

  await recordAuditLog({
    userId: actorUserId,
    action: `transfer.${action.toLowerCase()}`,
    entityType: "AssetTransfer",
    entityId: transferId,
    newValue: { step: transfer.currentApprovalStep, comment },
  });

  return result;
}

/**
 * Destination PIC confirms the asset physically arrived. This is the ONLY
 * place Asset.currentRoomId/currentPicId change for a transfer — approval
 * alone never moves the asset, per business rules 7 & 8.
 */
export async function confirmReceipt(transferId: string, actorUserId: string) {
  const transfer = await prisma.assetTransfer.findUniqueOrThrow({ where: { id: transferId } });

  if (transfer.status !== "APPROVED" && transfer.status !== "IN_TRANSIT") {
    throw httpError(409, `Cannot confirm receipt for a transfer in status ${transfer.status}.`);
  }

  const primaryPic = await prisma.roomPic.findFirst({
    where: { roomId: transfer.toRoomId, picType: "PRIMARY", isActive: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    await tx.asset.update({
      where: { id: transfer.assetId },
      data: {
        currentRoomId: transfer.toRoomId,
        currentPicId: primaryPic?.userId ?? null,
      },
    });

    return tx.assetTransfer.update({
      where: { id: transferId },
      data: { status: "COMPLETED", receivedAt: new Date(), completedAt: new Date() },
    });
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "transfer.receive",
    entityType: "AssetTransfer",
    entityId: transferId,
    newValue: { toRoomId: transfer.toRoomId },
  });

  return result;
}

export async function cancelTransfer(transferId: string, actorUserId: string, reason: string | undefined) {
  const transfer = await prisma.assetTransfer.findUniqueOrThrow({ where: { id: transferId } });

  if (transfer.status !== "DRAFT" && transfer.status !== "PENDING_APPROVAL") {
    throw httpError(409, `Cannot cancel a transfer in status ${transfer.status}.`);
  }

  const result = await prisma.assetTransfer.update({
    where: { id: transferId },
    data: { status: "CANCELLED", cancelledReason: reason },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "transfer.cancel",
    entityType: "AssetTransfer",
    entityId: transferId,
    newValue: { reason },
  });

  return result;
}

/** Every PENDING_APPROVAL transfer the given user is eligible to act on right now. */
export async function listPendingApprovalsFor(userId: string, userRoleNames: string[]) {
  const pending = await prisma.assetTransfer.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: { asset: { include: { category: true } }, fromRoom: true, toRoom: true, requestedBy: true },
    orderBy: { requestedAt: "asc" },
  });

  const eligible = [];
  for (const t of pending) {
    if (await canActOnCurrentStep(t.id, userId, userRoleNames)) {
      eligible.push(t);
    }
  }
  return eligible;
}

function httpError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}
