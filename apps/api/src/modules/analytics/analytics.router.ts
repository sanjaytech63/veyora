import { Router } from "express";
import { analyticsController } from "./controllers/analytics.controller";
import { requireAuth, requireRole, requirePermission } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import { dashboardQuerySchema } from "@veyora/validators";

const router = Router();

// All analytics routes require authentication, admin/superadmin privileges, and analytics:read permission
router.use(
  "/admin/analytics",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("analytics:read")
);

// 1. Comprehensive Master Dashboard
router.get(
  "/admin/analytics/dashboard",
  validate({ query: dashboardQuerySchema }),
  analyticsController.getDashboard.bind(analyticsController)
);

// 2. Revenue & Sales Performance Deep-Dive
router.get(
  "/admin/analytics/revenue",
  validate({ query: dashboardQuerySchema }),
  analyticsController.getRevenueAnalytics.bind(analyticsController)
);

// 3. Orders Overview & Status Breakdown
router.get(
  "/admin/analytics/orders",
  validate({ query: dashboardQuerySchema }),
  analyticsController.getOrdersAnalytics.bind(analyticsController)
);

// 4. Customer Acquisition & Cohort Analytics
router.get(
  "/admin/analytics/customers",
  validate({ query: dashboardQuerySchema }),
  analyticsController.getCustomersAnalytics.bind(analyticsController)
);

// 5. Product Performance & Bestseller Ranking
router.get(
  "/admin/analytics/products",
  validate({ query: dashboardQuerySchema }),
  analyticsController.getProductsAnalytics.bind(analyticsController)
);

// 6. Real-time Inventory Health & Depletion Warnings
router.get(
  "/admin/analytics/inventory",
  analyticsController.getInventoryAnalytics.bind(analyticsController)
);

export const analyticsRouter = router;
