import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";

export const adminUserRoleSchema = z.enum(["customer", "admin", "superadmin"]);
export type AdminUserRole = z.infer<typeof adminUserRoleSchema>;

export const adminUserQuerySchema = paginationQuerySchema.extend({
  role: adminUserRoleSchema.optional(),
  isActive: z
    .preprocess((val) => {
      if (typeof val === "string") return val.toLowerCase() === "true";
      return val;
    }, z.boolean())
    .optional(),
  isEmailVerified: z
    .preprocess((val) => {
      if (typeof val === "string") return val.toLowerCase() === "true";
      return val;
    }, z.boolean())
    .optional(),
});

export type AdminUserQueryInput = z.input<typeof adminUserQuerySchema>;
export type AdminUserQueryData = z.output<typeof adminUserQuerySchema>;
