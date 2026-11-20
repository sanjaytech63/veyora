import { z } from "zod";
import { adminUserRoleSchema } from "./admin-user-query.schema";

export const updateUserRoleSchema = z.object({
  role: adminUserRoleSchema,
  permissions: z.array(z.string().trim()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
