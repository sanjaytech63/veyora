import { Router } from "express";
import { couponController } from "./controllers/coupon.controller";
import { optionalAuth, requireAuth, requireRole } from "../../middleware/auth";
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
  validate({ query: couponListQuerySchema }),
  couponController.listCoupons.bind(couponController)
);

router.post(
  "/admin/coupons",
  requireAuth,
  requireRole("admin", "superadmin"),
  validate({ body: createCouponSchema }),
  couponController.createCoupon.bind(couponController)
);

router.get(
  "/admin/coupons/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  couponController.getCouponById.bind(couponController)
);

router.put(
  "/admin/coupons/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  validate({ body: updateCouponSchema }),
  couponController.updateCoupon.bind(couponController)
);

router.patch(
  "/admin/coupons/:id/toggle-status",
  requireAuth,
  requireRole("admin", "superadmin"),
  couponController.toggleCouponStatus.bind(couponController)
);

router.delete(
  "/admin/coupons/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  couponController.deleteCoupon.bind(couponController)
);

router.get(
  "/admin/coupons/:id/analytics",
  requireAuth,
  requireRole("admin", "superadmin"),
  couponController.getCouponAnalytics.bind(couponController)
);

export const couponRouter = router;
