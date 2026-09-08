import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "./audit-log.service";

// ===================== BUILDINGS =====================

export async function listBuildings() {
  return prisma.building.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { rooms: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createBuilding(
  input: { name: string; code: string; address?: string },
  actorUserId: string | null
) {
  const building = await prisma.building.create({ data: input });
  await recordAuditLog({
    userId: actorUserId,
    action: "building.create",
    entityType: "Building",
    entityId: building.id,
    newValue: input,
  });
  return building;
}

// ===================== ROOMS =====================

export async function listRooms(filters?: { buildingId?: string; departmentId?: string }) {
  return prisma.room.findMany({
    where: {
      deletedAt: null,
      buildingId: filters?.buildingId || undefined,
      departmentId: filters?.departmentId || undefined,
    },
    include: {
      building: true,
      department: true,
      pics: { where: { isActive: true }, include: { user: true } },
      _count: { select: { assets: { where: { deletedAt: null } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRoomById(id: string) {
  return prisma.room.findFirst({
    where: { id, deletedAt: null },
    include: {
      building: true,
      department: true,
      pics: { where: { isActive: true }, include: { user: true }, orderBy: { picType: "asc" } },
      assets: {
        where: { deletedAt: null },
        include: { category: true },
        orderBy: { name: "asc" },
      },
    },
  });
}

export interface CreateRoomInput {
  roomCode: string;
  name: string;
  buildingId: string;
  floor?: string;
  departmentId?: string;
  roomType?: string;
  capacity?: number;
  description?: string;
}

export async function createRoom(input: CreateRoomInput, actorUserId: string | null) {
  const room = await prisma.room.create({
    data: {
      roomCode: input.roomCode,
      name: input.name,
      buildingId: input.buildingId,
      floor: input.floor,
      departmentId: input.departmentId,
      roomType: (input.roomType as never) || undefined,
      capacity: input.capacity,
      description: input.description,
    },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "room.create",
    entityType: "Room",
    entityId: room.id,
    newValue: input,
  });

  return room;
}

export interface UpdateRoomInput {
  name?: string;
  floor?: string;
  departmentId?: string | null;
  roomType?: string;
  capacity?: number | null;
  description?: string;
  status?: string;
}

export async function updateRoom(id: string, input: UpdateRoomInput, actorUserId: string | null) {
  const before = await prisma.room.findUniqueOrThrow({ where: { id } });

  const room = await prisma.room.update({
    where: { id },
    data: {
      name: input.name,
      floor: input.floor,
      departmentId: input.departmentId,
      roomType: (input.roomType as never) || undefined,
      capacity: input.capacity,
      description: input.description,
      status: (input.status as never) || undefined,
    },
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "room.update",
    entityType: "Room",
    entityId: id,
    oldValue: { name: before.name, status: before.status },
    newValue: { name: room.name, status: room.status },
  });

  return room;
}

// ===================== ROOM PIC =====================

/**
 * Assigns a user as Primary or Backup PIC for a room.
 *
 * Business rule: a room can have only ONE active Primary PIC at a time
 * (multiple active Backups are allowed). Assigning a new Primary
 * automatically deactivates the previous one — this can't be expressed as
 * a DB constraint in Prisma (no partial unique index support), so it's
 * enforced here, inside a transaction, instead.
 *
 * When the Primary PIC changes, every asset currently in that room has its
 * denormalized `currentPicId` updated to match — this is what keeps
 * Asset.currentPicId in sync without the UI having to know about it.
 */
export async function assignRoomPic(
  roomId: string,
  userId: string,
  picType: "PRIMARY" | "BACKUP",
  actorUserId: string | null
) {
  const result = await prisma.$transaction(async (tx) => {
    if (picType === "PRIMARY") {
      // Deactivate any existing active primary PIC for this room.
      await tx.roomPic.updateMany({
        where: { roomId, picType: "PRIMARY", isActive: true },
        data: { isActive: false, unassignedAt: new Date() },
      });
    }

    const pic = await tx.roomPic.create({
      data: { roomId, userId, picType, isActive: true },
    });

    if (picType === "PRIMARY") {
      // Keep every asset currently located in this room in sync with its
      // new accountable person.
      await tx.asset.updateMany({
        where: { currentRoomId: roomId, deletedAt: null },
        data: { currentPicId: userId },
      });
    }

    return pic;
  });

  await recordAuditLog({
    userId: actorUserId,
    action: "room_pic.assign",
    entityType: "Room",
    entityId: roomId,
    newValue: { userId, picType },
  });

  return result;
}

export async function unassignRoomPic(roomPicId: string, actorUserId: string | null) {
  const pic = await prisma.roomPic.update({
    where: { id: roomPicId },
    data: { isActive: false, unassignedAt: new Date() },
  });

  if (pic.picType === "PRIMARY") {
    // Room now has no accountable primary PIC — clear currentPicId on its
    // assets rather than leaving a stale reference to someone no longer
    // responsible for them.
    await prisma.asset.updateMany({
      where: { currentRoomId: pic.roomId, currentPicId: pic.userId, deletedAt: null },
      data: { currentPicId: null },
    });
  }

  await recordAuditLog({
    userId: actorUserId,
    action: "room_pic.unassign",
    entityType: "Room",
    entityId: pic.roomId,
    oldValue: { userId: pic.userId, picType: pic.picType },
  });

  return pic;
}
