import { Router } from "express";
import { rbacController } from "./controllers/rbac.controller";
import { requireAuth, requireRole, requirePermission, requireAnyPermission } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import {
  createRoleSchema,
  updateRoleSchema,
  createStaffUserSchema,
  updateStaffUserSchema,
  updateStaffStatusSchema,
  staffListQuerySchema,
  auditLogQuerySchema,
} from "@veyora/validators";

const router = Router();

// Base administrative gate: all RBAC endpoints require authentication and staff status
router.use("/admin", requireAuth, requireRole("admin", "superadmin"));

// ==========================================
// 1. PERMISSIONS REGISTRY
// ==========================================
router.get(
  "/admin/permissions",
  requireAnyPermission("roles:read", "staff:read"),
  rbacController.getPermissions.bind(rbacController)
);

// ==========================================
// 2. ROLES MANAGEMENT
// ==========================================
router.get(
  "/admin/roles",
  requirePermission("roles:read"),
  rbacController.listRoles.bind(rbacController)
);

router.get(
  "/admin/roles/:id",
  requirePermission("roles:read"),
  rbacController.getRoleById.bind(rbacController)
);

router.post(
  "/admin/roles",
  requirePermission("roles:write"),
  validate({ body: createRoleSchema }),
  rbacController.createRole.bind(rbacController)
);

router.put(
  "/admin/roles/:id",
  requirePermission("roles:write"),
  validate({ body: updateRoleSchema }),
  rbacController.updateRole.bind(rbacController)
);

router.delete(
  "/admin/roles/:id",
  requirePermission("roles:delete"),
  rbacController.deleteRole.bind(rbacController)
);

// ==========================================
// 3. STAFF USERS MANAGEMENT
// ==========================================
router.get(
  "/admin/staff",
  requirePermission("staff:read"),
  validate({ query: staffListQuerySchema }),
  rbacController.listStaff.bind(rbacController)
);

router.get(
  "/admin/staff/:id",
  requirePermission("staff:read"),
  rbacController.getStaffById.bind(rbacController)
);

router.post(
  "/admin/staff",
  requirePermission("staff:write"),
  validate({ body: createStaffUserSchema }),
  rbacController.createStaff.bind(rbacController)
);

router.put(
  "/admin/staff/:id",
  requirePermission("staff:write"),
  validate({ body: updateStaffUserSchema }),
  rbacController.updateStaff.bind(rbacController)
);

router.patch(
  "/admin/staff/:id/status",
  requirePermission("staff:write"),
  validate({ body: updateStaffStatusSchema }),
  rbacController.updateStaffStatus.bind(rbacController)
);

router.delete(
  "/admin/staff/:id",
  requirePermission("staff:delete"),
  rbacController.deleteStaff.bind(rbacController)
);

// ==========================================
// 4. SECURITY AUDIT LOGS
// ==========================================
router.get(
  "/admin/audit-logs",
  requirePermission("audit:read"),
  validate({ query: auditLogQuerySchema }),
  rbacController.listAuditLogs.bind(rbacController)
);

export const rbacRouter = router;
