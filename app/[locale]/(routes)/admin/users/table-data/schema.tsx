import { z } from "zod";

export const adminUserSchema = z.object({
  id: z.string(),
  created_on: z.any(),
  lastLoginAt: z.any().nullable().optional(),
  role: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  email: z.string(),
  userStatus: z.string(),
  created_by: z.object({
    name: z.string().nullable().optional(),
  }).nullable().optional(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;
