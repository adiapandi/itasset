import { z } from "zod";

export const createBuildingSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(20).toUpperCase(),
  address: z.string().optional(),
});

const roomTypeEnum = z.enum([
  "OFFICE",
  "MEETING_ROOM",
  "SERVER_ROOM",
  "WAREHOUSE",
  "STORAGE_ROOM",
  "RECEPTION",
  "TRAINING_ROOM",
  "OTHER",
]);

export const createRoomSchema = z.object({
  roomCode: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(2),
  buildingId: z.string().min(1),
  floor: z.string().optional(),
  departmentId: z.string().optional(),
  roomType: roomTypeEnum.optional(),
  capacity: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(2).optional(),
  floor: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  roomType: roomTypeEnum.optional(),
  capacity: z.coerce.number().int().positive().nullable().optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const assignRoomPicSchema = z.object({
  userId: z.string().min(1),
  picType: z.enum(["PRIMARY", "BACKUP"]),
});
