import { prisma } from "@/lib/prisma";

// ===================== 1. ASSET INVENTORY =====================

export interface InventoryFilters {
  categoryId?: string;
  status?: string;
  departmentId?: string;
  roomId?: string;
}

export async function getInventoryReport(filters: InventoryFilters) {
  return prisma.asset.findMany({
    where: {
      deletedAt: null,
      categoryId: filters.categoryId || undefined,
      status: (filters.status as never) || undefined,
      departmentId: filters.departmentId || undefined,
      currentRoomId: filters.roomId || undefined,
    },
    include: { category: true, department: true, currentRoom: true, assignedUser: true, vendor: true },
    orderBy: { assetCode: "asc" },
  });
}

// ===================== 2. ASSETS BY DEPARTMENT / ROOM =====================

export async function getByDepartmentReport() {
  const departments = await prisma.department.findMany({
    include: {
      assets: {
        where: { deletedAt: null },
        include: { category: true, currentRoom: true },
      },
    },
    orderBy: { name: "asc" },
  });
  // Assets with no department at all still need to show up somewhere.
  const unassigned = await prisma.asset.findMany({
    where: { deletedAt: null, departmentId: null },
    include: { category: true, currentRoom: true },
  });
  return { departments, unassigned };
}

export async function getByRoomReport() {
  const rooms = await prisma.room.findMany({
    where: { deletedAt: null },
    include: {
      building: true,
      assets: {
        where: { deletedAt: null },
        include: { category: true },
      },
    },
    orderBy: { name: "asc" },
  });
  const unassigned = await prisma.asset.findMany({
    where: { deletedAt: null, currentRoomId: null },
    include: { category: true },
  });
  return { rooms, unassigned };
}

// ===================== 3. WARRANTY =====================

export async function getWarrantyReport() {
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const assets = await prisma.asset.findMany({
    where: { deletedAt: null, warrantyEndDate: { not: null } },
    include: { category: true, department: true },
    orderBy: { warrantyEndDate: "asc" },
  });

  return {
    expired: assets.filter((a) => a.warrantyEndDate && a.warrantyEndDate < now),
    expiringSoon: assets.filter((a) => a.warrantyEndDate && a.warrantyEndDate >= now && a.warrantyEndDate <= in90Days),
    active: assets.filter((a) => a.warrantyEndDate && a.warrantyEndDate > in90Days),
  };
}

// ===================== 4. TRANSFER HISTORY =====================

export interface DateRangeFilters {
  from?: string;
  to?: string;
}

export async function getTransferReport(filters: DateRangeFilters) {
  return prisma.assetTransfer.findMany({
    where: {
      requestedAt: {
        gte: filters.from ? new Date(filters.from) : undefined,
        lte: filters.to ? new Date(filters.to) : undefined,
      },
    },
    include: { asset: true, fromRoom: true, toRoom: true, requestedBy: true },
    orderBy: { requestedAt: "desc" },
  });
}

// ===================== 5. MAINTENANCE HISTORY =====================

export async function getMaintenanceReport(filters: DateRangeFilters) {
  return prisma.maintenanceRecord.findMany({
    where: {
      startDate: {
        gte: filters.from ? new Date(filters.from) : undefined,
        lte: filters.to ? new Date(filters.to) : undefined,
      },
    },
    include: { asset: true, vendor: true },
    orderBy: { startDate: "desc" },
  });
}

// ===================== 6. LOST / DAMAGED / RETIRED / DISPOSED =====================

const PROBLEM_STATUSES = ["DAMAGED", "LOST", "STOLEN", "RETIRED", "DISPOSED"] as const;

export async function getStatusReport() {
  return prisma.asset.findMany({
    where: { deletedAt: null, status: { in: [...PROBLEM_STATUSES] } },
    include: { category: true, department: true, currentRoom: true },
    orderBy: { updatedAt: "desc" },
  });
}

// ===================== 7. AUDIT SUMMARY =====================

export async function getAuditReport() {
  const sessions = await prisma.auditSession.findMany({
    include: {
      room: true,
      startedBy: true,
      items: true,
    },
    orderBy: { startedAt: "desc" },
  });

  return sessions.map((s) => {
    const counts = s.items.reduce(
      (acc, i) => {
        const key = i.result ?? "PENDING";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return {
      id: s.id,
      name: s.name,
      room: s.room,
      startedBy: s.startedBy,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      total: s.items.length,
      counts,
    };
  });
}

// ===================== Flat-row exporters (CSV/XLSX) =====================

export function flattenInventory(rows: Awaited<ReturnType<typeof getInventoryReport>>) {
  return rows.map((a) => ({
    "Asset Code": a.assetCode,
    Name: a.name,
    Category: a.category.name,
    Status: a.status,
    Condition: a.condition,
    Department: a.department?.name ?? "",
    Room: a.currentRoom?.name ?? "",
    "Assigned To": a.assignedUser?.name ?? "",
    Vendor: a.vendor?.name ?? "",
    "Purchase Date": a.purchaseDate?.toISOString().slice(0, 10) ?? "",
    "Warranty End": a.warrantyEndDate?.toISOString().slice(0, 10) ?? "",
  }));
}

export function flattenTransfers(rows: Awaited<ReturnType<typeof getTransferReport>>) {
  return rows.map((t) => ({
    Asset: t.asset.name,
    "Asset Code": t.asset.assetCode,
    From: t.fromRoom?.name ?? "",
    To: t.toRoom.name,
    "Requested By": t.requestedBy.name,
    "Requested At": t.requestedAt.toISOString().slice(0, 10),
    Status: t.status,
  }));
}

export function flattenMaintenance(rows: Awaited<ReturnType<typeof getMaintenanceReport>>) {
  return rows.map((m) => ({
    Asset: m.asset.name,
    "Asset Code": m.asset.assetCode,
    Type: m.maintenanceType,
    Vendor: m.vendor?.name ?? "",
    "Start Date": m.startDate.toISOString().slice(0, 10),
    "End Date": m.endDate?.toISOString().slice(0, 10) ?? "",
    Status: m.status,
    Cost: m.cost?.toString() ?? "",
  }));
}

export function flattenStatusReport(rows: Awaited<ReturnType<typeof getStatusReport>>) {
  return rows.map((a) => ({
    "Asset Code": a.assetCode,
    Name: a.name,
    Category: a.category.name,
    Status: a.status,
    Department: a.department?.name ?? "",
    Room: a.currentRoom?.name ?? "",
    "Updated At": a.updatedAt.toISOString().slice(0, 10),
  }));
}
