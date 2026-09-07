import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  employeeId: z.string().optional(),
  departmentId: z.string().optional(),
  roleIds: z.array(z.string()).min(1, "Select at least one role"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  employeeId: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string()).optional(),
});

export type CreateUserPayload = z.infer<typeof createUserSchema>;
export type UpdateUserPayload = z.infer<typeof updateUserSchema>;
