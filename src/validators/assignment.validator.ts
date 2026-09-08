import { z } from "zod";

export const assignEmployeeSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().optional(),
});

export const unassignEmployeeSchema = z.object({
  reason: z.string().optional(),
});
