import { Router } from "express";
import { couponController } from "./controllers/coupon.controller";
import { optionalAuth, requireAuth, requireRole, requirePermission } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  couponListQuerySchema,
} from "@veyora/validators";

const router = Router();

// ==========================================
// STOREFRONT & CUSTOMER VALIDATION
// ==========================================

router.post(
  "/coupons/validate",
  optionalAuth,
  validate({ body: validateCouponSchema }),
  couponController.validateCoupon.bind(couponController)
);

// ==========================================
// ADMINISTRATOR PROMOTION GOVERNANCE
// ==========================================

router.get(
  "/admin/coupons",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("coupons:read"),
  validate({ query: couponListQuerySchema }),
  couponController.listCoupons.bind(couponController)
);

router.post(
  "/admin/coupons",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("coupons:write"),
  validate({ body: createCouponSchema }),
  couponController.createCoupon.bind(couponController)
);

router.get(
  "/admin/coupons/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("coupons:read"),
  couponController.getCouponById.bind(couponController)
);

router.put(
  "/admin/coupons/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("coupons:write"),
  validate({ body: updateCouponSchema }),
  couponController.updateCoupon.bind(couponController)
);

router.patch(
  "/admin/coupons/:id/toggle-status",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("coupons:write"),
  couponController.toggleCouponStatus.bind(couponController)
);

router.delete(
  "/admin/coupons/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("coupons:delete"),
  couponController.deleteCoupon.bind(couponController)
);

router.get(
  "/admin/coupons/:id/analytics",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("coupons:read"),
  couponController.getCouponAnalytics.bind(couponController)
);

export const couponRouter = router;
