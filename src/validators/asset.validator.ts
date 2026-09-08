import { z } from "zod";

const assetStatusEnum = z.enum([
  "AVAILABLE",
  "ASSIGNED",
  "IN_STORAGE",
  "UNDER_MAINTENANCE",
  "DAMAGED",
  "LOST",
  "STOLEN",
  "RETIRED",
  "DISPOSED",
]);

const assetConditionEnum = z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]);

export const createAssetSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  categoryId: z.string().min(1, "Category is required"),
  modelId: z.string().optional(),
  brand: z.string().optional(),
  serialNumber: z.string().optional(),
  vendorId: z.string().optional(),
  departmentId: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  warrantyStartDate: z.string().optional(),
  warrantyEndDate: z.string().optional(),
  condition: assetConditionEnum.optional(),
  currentRoomId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAssetSchema = createAssetSchema.partial().extend({
  status: assetStatusEnum.optional(),
});

export type CreateAssetPayload = z.infer<typeof createAssetSchema>;
export type UpdateAssetPayload = z.infer<typeof updateAssetSchema>;
