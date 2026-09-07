import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10).toUpperCase(),
  parentCategoryId: z.string().optional(),
});

export const createModelSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
});

export const createVendorSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});
