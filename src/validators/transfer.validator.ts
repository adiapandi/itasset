import { z } from "zod";

export const createTransferSchema = z.object({
  assetId: z.string().min(1),
  toRoomId: z.string().min(1),
  reason: z.string().optional(),
});

export const transferActionSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED", "REVISION_REQUESTED"]),
  comment: z.string().optional(),
});

export const cancelTransferSchema = z.object({
  reason: z.string().optional(),
});
