import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "./audit-log.service";

export async function createAuditSession(
  input: { roomId: string; name?: string },
  actorUserId: string
) {
  const room = await prisma.room.findUniqueOrThrow({ where: { id: input.roomId } });

  // Snapshot every asset currently in this room as "expected" — frozen at
  // start time, so a transfer completing mid-audit doesn't change what the
  // auditor is supposed to find.
  const expectedAssets = await prisma.asset.findMany({
    where: { currentRoomId: input.roomId, deletedAt: null },
    select: { id: true },
  });

  const session = await prisma.auditSession.create({
    data: {
      name: input.name?.trim() || `${room.name} — ${new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`,
      roomId: input.roomId,
      startedById: actorUserId,
      items: {
        create: expectedAssets.map((a) => ({
          assetId: a.id,
          expectedRoomId: input.roomId,
        })),
      },
    },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "audit.create",
    entityType: "AuditSession",
    entityId: session.id,
    newValue: { roomId: input.roomId, expectedCount: expectedAssets.length },
  });

  return session;
}

export async function getAuditSessionById(id: string) {
  return prisma.auditSession.findUnique({
    where: { id },
    include: {
      room: { include: { building: true } },
      startedBy: true,
      items: {
        include: { asset: { include: { category: true } }, scannedBy: true },
        orderBy: { asset: { name: "asc" } },
      },
    },
  });
}

export async function listAuditSessions() {
  return prisma.auditSession.findMany({
    include: { room: true, startedBy: true, _count: { select: { items: true } } },
    orderBy: { startedAt: "desc" },
  });
}

export interface ScanResult {
  assetName: string;
  assetCode: string;
  result: "VERIFIED" | "WRONG_LOCATION" | "EXTRA";
}

/**
 * Resolves a scanned asset code against the session's expected snapshot.
 * - Already in the snapshot (expected here) → VERIFIED.
 * - Not in the snapshot, and the system still says it belongs here →
 *   VERIFIED too (added to the room after the snapshot was taken).
 * - Not in the snapshot, and the system says it belongs elsewhere →
 *   WRONG_LOCATION (found somewhere it shouldn't be) — also logged as an
 *   EXTRA-style find for this room's report, distinct from the room it's
 *   nominally assigned to.
 *
 * `markDamaged` overrides the computed result with DAMAGED regardless —
 * the physical condition finding is the more actionable one to surface.
 */
export async function scanAssetInAudit(
  auditSessionId: string,
  assetCode: string,
  actorUserId: string,
  markDamaged: boolean,
  notes: string | undefined
): Promise<ScanResult> {
  const session = await prisma.auditSession.findUniqueOrThrow({ where: { id: auditSessionId } });
  if (session.status !== "IN_PROGRESS") {
    throw httpError(409, `Cannot scan into a session that is ${session.status}.`);
  }

  const asset = await prisma.asset.findFirst({
    where: { assetCode: assetCode.toUpperCase(), deletedAt: null },
  });
  if (!asset) {
    throw httpError(404, `No asset found with code "${assetCode}".`);
  }

  const existingItem = await prisma.auditItem.findUnique({
    where: { auditSessionId_assetId: { auditSessionId, assetId: asset.id } },
  });

  const belongsHere = asset.currentRoomId === session.roomId;
  const computedResult = markDamaged ? "DAMAGED" : belongsHere ? "VERIFIED" : "WRONG_LOCATION";

  if (existingItem) {
    await prisma.auditItem.update({
      where: { id: existingItem.id },
      data: {
        scannedRoomId: session.roomId,
        result: computedResult,
        scannedById: actorUserId,
        scannedAt: new Date(),
        notes,
      },
    });
  } else {
    await prisma.auditItem.create({
      data: {
        auditSessionId,
        assetId: asset.id,
        expectedRoomId: asset.currentRoomId,
        scannedRoomId: session.roomId,
        result: computedResult,
        scannedById: actorUserId,
        scannedAt: new Date(),
        notes,
      },
    });
  }

  await recordAuditLog({
    userId: actorUserId,
    action: "audit.scan",
    entityType: "AuditSession",
    entityId: auditSessionId,
    newValue: { assetCode: asset.assetCode, result: computedResult },
  });

  return {
    assetName: asset.name,
    assetCode: asset.assetCode,
    result: markDamaged ? "VERIFIED" : belongsHere ? "VERIFIED" : "WRONG_LOCATION", // UI-facing subset; DAMAGED shown via badge separately
  };
}

/** Any expected item never scanned becomes MISSING; then the session closes. */
export async function completeAuditSession(id: string, actorUserId: string) {
  const session = await prisma.auditSession.findUniqueOrThrow({ where: { id } });
  if (session.status !== "IN_PROGRESS") {
    throw httpError(409, `Session is already ${session.status}.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.auditItem.updateMany({
      where: { auditSessionId: id, result: null },
      data: { result: "MISSING" },
    });

    return tx.auditSession.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "audit.complete",
    entityType: "AuditSession",
    entityId: id,
  });

  return result;
}

export async function cancelAuditSession(id: string, actorUserId: string) {
  const session = await prisma.auditSession.findUniqueOrThrow({ where: { id } });
  if (session.status !== "IN_PROGRESS") {
    throw httpError(409, `Session is already ${session.status}.`);
  }

  const result = await prisma.auditSession.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "audit.cancel",
    entityType: "AuditSession",
    entityId: id,
  });

  return result;
}

function httpError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}
