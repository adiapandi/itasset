import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "./audit-log.service";

// Statuses we're willing to auto-flip on assign/unassign. An asset that's
// e.g. UNDER_MAINTENANCE, DAMAGED, LOST, or RETIRED keeps that status even
// if it gets (un)assigned — assignment shouldn't silently paper over a
// more important state.
const AUTO_MANAGED_STATUSES = new Set(["AVAILABLE", "ASSIGNED"]);

/**
 * Assigns an asset to an employee. Per the architecture doc's business rule,
 * this is independent from currentRoomId/currentPicId — an asset can be
 * assigned to Jane while physically sitting in a room whose PIC is someone
 * else entirely.
 *
 * Closes out any currently-open EMPLOYEE assignment record before opening
 * a new one, so asset_assignments always reflects a clean, non-overlapping
 * timeline per asset.
 */
export async function assignToEmployee(
  assetId: string,
  userId: string,
  reason: string | undefined,
  actorUserId: string | null
) {
  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: assetId } });

  const result = await prisma.$transaction(async (tx) => {
    await tx.assetAssignment.updateMany({
      where: { assetId, assignmentType: "EMPLOYEE", endedAt: null },
      data: { endedAt: new Date() },
    });

    await tx.assetAssignment.create({
      data: {
        assetId,
        assignmentType: "EMPLOYEE",
        userId,
        reason,
        createdBy: actorUserId ?? undefined,
      },
    });

    return tx.asset.update({
      where: { id: assetId },
      data: {
        assignedUserId: userId,
        status: AUTO_MANAGED_STATUSES.has(asset.status) ? "ASSIGNED" : undefined,
      },
      include: { assignedUser: true },
    });
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "asset.assign",
    entityType: "Asset",
    entityId: assetId,
    oldValue: { assignedUserId: asset.assignedUserId },
    newValue: { assignedUserId: userId, reason },
  });

  return result;
}

export async function unassignFromEmployee(
  assetId: string,
  reason: string | undefined,
  actorUserId: string | null
) {
  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: assetId } });

  const result = await prisma.$transaction(async (tx) => {
    await tx.assetAssignment.updateMany({
      where: { assetId, assignmentType: "EMPLOYEE", endedAt: null },
      data: { endedAt: new Date() },
    });

    return tx.asset.update({
      where: { id: assetId },
      data: {
        assignedUserId: null,
        status: AUTO_MANAGED_STATUSES.has(asset.status) ? "AVAILABLE" : undefined,
      },
    });
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "asset.unassign",
    entityType: "Asset",
    entityId: assetId,
    oldValue: { assignedUserId: asset.assignedUserId },
    newValue: { assignedUserId: null, reason },
  });

  return result;
}

export async function getAssignmentHistory(assetId: string) {
  return prisma.assetAssignment.findMany({
    where: { assetId },
    include: { user: true },
    orderBy: { startedAt: "desc" },
  });
}

/** Assets currently assigned to a given user — backs the Employee "view own" scope. */
export async function listAssetsAssignedTo(userId: string) {
  return prisma.asset.findMany({
    where: { assignedUserId: userId, deletedAt: null },
    include: { category: true, currentRoom: true },
    orderBy: { name: "asc" },
  });
}
