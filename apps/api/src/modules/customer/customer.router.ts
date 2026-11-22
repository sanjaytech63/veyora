import { Router } from "express";
import { customerController } from "./controllers/customer.controller";
import { requireAuth, requireRole, requirePermission } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import {
  adminCustomerListQuerySchema,
  updateCustomerStatusSchema,
  updateCustomerNotesSchema,
} from "@veyora/validators";

const router = Router();

// ==========================================
// ADMINISTRATOR CUSTOMER GOVERNANCE
// ==========================================

router.get(
  "/admin/customers",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("customers:read"),
  validate({ query: adminCustomerListQuerySchema }),
  customerController.listCustomers.bind(customerController)
);

router.get(
  "/admin/customers/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("customers:read"),
  customerController.getCustomerById.bind(customerController)
);

router.get(
  "/admin/customers/:id/orders",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("customers:read"),
  customerController.getCustomerOrders.bind(customerController)
);

router.get(
  "/admin/customers/:id/addresses",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("customers:read"),
  customerController.getCustomerAddresses.bind(customerController)
);

router.patch(
  "/admin/customers/:id/status",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("customers:write"),
  validate({ body: updateCustomerStatusSchema }),
  customerController.updateCustomerStatus.bind(customerController)
);

router.patch(
  "/admin/customers/:id/notes",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("customers:write"),
  validate({ body: updateCustomerNotesSchema }),
  customerController.updateCustomerNotes.bind(customerController)
);

router.get(
  "/admin/customers/:id/activity",
  requireAuth,
  requireRole("admin", "superadmin"),
  customerController.getCustomerActivity.bind(customerController)
);

export const customerRouter = router;
