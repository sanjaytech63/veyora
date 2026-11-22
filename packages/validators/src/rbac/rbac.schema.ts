import { z } from "zod";

export const standardPermissionEnum = z.enum([
  "products:read",
  "products:write",
  "products:delete",
  "categories:read",
  "categories:write",
  "categories:delete",
  "inventory:read",
  "inventory:write",
  "orders:read",
  "orders:write",
  "orders:cancel",
  "orders:update_status",
  "customers:read",
  "customers:write",
  "payments:read",
  "payments:refund",
  "coupons:read",
  "coupons:write",
  "coupons:delete",
  "analytics:read",
  "settings:read",
  "settings:write",
  "staff:read",
  "staff:write",
  "staff:delete",
  "roles:read",
  "roles:write",
  "roles:delete",
  "audit:read",
]);

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must have at least 2 characters")
    .max(50, "Role name cannot exceed 50 characters")
    .regex(/^[a-z0-9_-]+$/, "Role name must contain only lowercase alphanumeric characters, hyphens, and underscores"),
  displayName: z
    .string()
    .min(2, "Display name must have at least 2 characters")
    .max(100, "Display name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().default(""),
  permissions: z.array(z.string().min(1)).min(1, "Role must contain at least one permission"),
});

export const updateRoleSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().min(1)).optional(),
});

export const createStaffUserSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum(["admin", "superadmin"]).default("admin"),
  assignedRoleIds: z.array(z.string()).optional().default([]),
  customPermissions: z.array(z.string()).optional().default([]),
});

export const updateStaffUserSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum(["admin", "superadmin"]).optional(),
  assignedRoleIds: z.array(z.string()).optional(),
  customPermissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const updateStaffStatusSchema = z.object({
  isActive: z.boolean(),
  statusReason: z.string().max(200).optional().nullable(),
});

export const assignRolesSchema = z.object({
  roleIds: z.array(z.string()).min(1, "At least one role ID is required"),
});

export const assignPermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

export const staffListQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const auditLogQuerySchema = z.object({
  actorId: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateRoleInputSchema = z.infer<typeof createRoleSchema>;
export type UpdateRoleInputSchema = z.infer<typeof updateRoleSchema>;
export type CreateStaffUserInputSchema = z.infer<typeof createStaffUserSchema>;
export type UpdateStaffUserInputSchema = z.infer<typeof updateStaffUserSchema>;
export type UpdateStaffStatusInputSchema = z.infer<typeof updateStaffStatusSchema>;
export type StaffListQuerySchema = z.infer<typeof staffListQuerySchema>;
export type AuditLogQuerySchema = z.infer<typeof auditLogQuerySchema>;
