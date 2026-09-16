import { z } from "zod";

export const createAuditSessionSchema = z.object({
  roomId: z.string().min(1),
  name: z.string().optional(),
});

export const scanAssetSchema = z.object({
  assetCode: z.string().min(1),
  markDamaged: z.boolean().optional(),
  notes: z.string().optional(),
});
