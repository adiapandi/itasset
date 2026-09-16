import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "./audit-log.service";

// Same guard used in assignment.service: only flip status automatically
// when the asset is in a "normal" state, never override DAMAGED / LOST /
// STOLEN / RETIRED / DISPOSED just because maintenance started or ended.
const AUTO_MANAGED_STATUSES = new Set(["AVAILABLE", "ASSIGNED", "UNDER_MAINTENANCE"]);
const ACTIVE_MAINTENANCE_STATUSES = ["SCHEDULED", "IN_PROGRESS"] as const;

export interface CreateMaintenanceInput {
  assetId: string;
  maintenanceType: string;
  vendorId?: string;
  technicianName?: string;
  startDate?: string;
  problemDescription?: string;
  notes?: string;
}

export async function createMaintenance(input: CreateMaintenanceInput, actorUserId: string | null) {
  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: input.assetId } });

  const existingActive = await prisma.maintenanceRecord.findFirst({
    where: { assetId: input.assetId, status: { in: [...ACTIVE_MAINTENANCE_STATUSES] } },
  });
  if (existingActive) {
    throw httpError(409, "This asset already has an open maintenance record.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.maintenanceRecord.create({
      data: {
        assetId: input.assetId,
        maintenanceType: input.maintenanceType,
        vendorId: input.vendorId,
        technicianName: input.technicianName,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        problemDescription: input.problemDescription,
        notes: input.notes,
        status: "SCHEDULED",
        createdBy: actorUserId ?? undefined,
      },
    });

    if (AUTO_MANAGED_STATUSES.has(asset.status)) {
      await tx.asset.update({ where: { id: input.assetId }, data: { status: "UNDER_MAINTENANCE" } });
    }

    return record;
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "maintenance.create",
    entityType: "MaintenanceRecord",
    entityId: result.id,
    newValue: { assetId: input.assetId, maintenanceType: input.maintenanceType },
  });

  return result;
}

export async function startMaintenance(id: string, actorUserId: string | null) {
  const record = await prisma.maintenanceRecord.findUniqueOrThrow({ where: { id } });
  if (record.status !== "SCHEDULED") {
    throw httpError(409, `Cannot start a maintenance record in status ${record.status}.`);
  }

  const result = await prisma.maintenanceRecord.update({
    where: { id },
    data: { status: "IN_PROGRESS" },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "maintenance.start",
    entityType: "MaintenanceRecord",
    entityId: id,
  });

  return result;
}

/**
 * Reverts the asset back to a normal status once maintenance ends — ASSIGNED
 * if it has an assigned employee, AVAILABLE otherwise — but only if the
 * asset is still UNDER_MAINTENANCE (never clobbers a status someone set
 * manually in between, e.g. DAMAGED discovered during the repair).
 */
async function revertAssetStatusIfUnderMaintenance(assetId: string, tx: typeof prisma) {
  const asset = await tx.asset.findUniqueOrThrow({ where: { id: assetId } });
  if (asset.status === "UNDER_MAINTENANCE") {
    await tx.asset.update({
      where: { id: assetId },
      data: { status: asset.assignedUserId ? "ASSIGNED" : "AVAILABLE" },
    });
  }
}

export interface CompleteMaintenanceInput {
  actionTaken: string;
  result?: string;
  cost?: number;
  warrantyClaim?: boolean;
  endDate?: string;
}

export async function completeMaintenance(
  id: string,
  input: CompleteMaintenanceInput,
  actorUserId: string | null
) {
  const record = await prisma.maintenanceRecord.findUniqueOrThrow({ where: { id } });
  if (record.status !== "SCHEDULED" && record.status !== "IN_PROGRESS") {
    throw httpError(409, `Cannot complete a maintenance record in status ${record.status}.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRecord.update({
      where: { id },
      data: {
        status: "COMPLETED",
        actionTaken: input.actionTaken,
        result: input.result,
        cost: input.cost,
        warrantyClaim: input.warrantyClaim ?? false,
        endDate: input.endDate ? new Date(input.endDate) : new Date(),
      },
    });

    await revertAssetStatusIfUnderMaintenance(record.assetId, tx as unknown as typeof prisma);

    return updated;
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "maintenance.complete",
    entityType: "MaintenanceRecord",
    entityId: id,
    newValue: { actionTaken: input.actionTaken, result: input.result },
  });

  return result;
}

export async function cancelMaintenance(id: string, reason: string | undefined, actorUserId: string | null) {
  const record = await prisma.maintenanceRecord.findUniqueOrThrow({ where: { id } });
  if (record.status !== "SCHEDULED" && record.status !== "IN_PROGRESS") {
    throw httpError(409, `Cannot cancel a maintenance record in status ${record.status}.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRecord.update({
      where: { id },
      data: { status: "CANCELLED", notes: reason ? `${record.notes ?? ""}\nCancelled: ${reason}`.trim() : record.notes },
    });

    await revertAssetStatusIfUnderMaintenance(record.assetId, tx as unknown as typeof prisma);

    return updated;
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "maintenance.cancel",
    entityType: "MaintenanceRecord",
    entityId: id,
    newValue: { reason },
  });

  return result;
}

export async function getMaintenanceById(id: string) {
  return prisma.maintenanceRecord.findUnique({
    where: { id },
    include: { asset: { include: { category: true } }, vendor: true },
  });
}

export async function listMaintenanceRecords(filters: { assetId?: string; status?: string }) {
  return prisma.maintenanceRecord.findMany({
    where: {
      assetId: filters.assetId,
      status: (filters.status as never) || undefined,
    },
    include: { asset: true, vendor: true },
    orderBy: { createdAt: "desc" },
  });
}

function httpError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}
