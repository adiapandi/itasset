import { prisma } from "@/lib/prisma";

interface RecordAuditParams {
  userId: string | null;
  action: string; // e.g. "user.create", "user.update", "user.deactivate"
  entityType: string; // e.g. "User"
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
}

/**
 * Every service that mutates data should call this — it's the single
 * choke point for audit_logs writes, so entries can't be forgotten
 * on a per-controller basis. Called from within service methods,
 * never directly from route handlers.
 */
export async function recordAuditLog(params: RecordAuditParams) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : undefined,
      newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : undefined,
      ipAddress: params.ipAddress ?? undefined,
    },
  });
}
