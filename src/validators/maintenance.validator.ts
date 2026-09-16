import { z } from "zod";

export const createMaintenanceSchema = z.object({
  assetId: z.string().min(1),
  maintenanceType: z.string().min(2),
  vendorId: z.string().optional(),
  technicianName: z.string().optional(),
  startDate: z.string().optional(),
  problemDescription: z.string().optional(),
  notes: z.string().optional(),
});

export const completeMaintenanceSchema = z.object({
  actionTaken: z.string().min(2),
  result: z.string().optional(),
  cost: z.coerce.number().nonnegative().optional(),
  warrantyClaim: z.boolean().optional(),
  endDate: z.string().optional(),
});

export const cancelMaintenanceSchema = z.object({
  reason: z.string().optional(),
});
