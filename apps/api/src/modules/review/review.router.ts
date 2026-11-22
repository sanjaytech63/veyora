import { Router } from "express";
import { reviewController } from "./controllers/review.controller";
import { validateRequest } from "../../middleware/validate-request";
import { requireAuth, requireRole, requirePermission } from "../../middleware/auth";
import {
  createReviewSchema,
  moderateReviewSchema,
  reviewQuerySchema,
  adminReviewQuerySchema,
} from "@veyora/validators";

const router = Router();

// ==========================================
// Public Storefront Endpoints
// ==========================================

router.get(
  "/products/:productId/reviews",
  validateRequest({ query: reviewQuerySchema }),
  reviewController.getProductReviews.bind(reviewController)
);

router.get(
  "/products/:productId/reviews/summary",
  reviewController.getProductRatingSummary.bind(reviewController)
);

router.post("/reviews/:id/helpful", reviewController.markHelpful.bind(reviewController));

// ==========================================
// Customer Authenticated Endpoints
// ==========================================

router.post(
  "/products/:productId/reviews",
  requireAuth,
  validateRequest({ body: createReviewSchema }),
  reviewController.submitReview.bind(reviewController)
);

router.get(
  "/reviews/my-reviews",
  requireAuth,
  reviewController.getUserReviews.bind(reviewController)
);

// ==========================================
// Admin Moderation Endpoints (RBAC: admin, superadmin)
// ==========================================

router.get(
  "/admin/reviews",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("products:read"),
  validateRequest({ query: adminReviewQuerySchema }),
  reviewController.listAdminReviews.bind(reviewController)
);

router.get(
  "/admin/reviews/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("products:read"),
  reviewController.getReviewById.bind(reviewController)
);

router.patch(
  "/admin/reviews/:id/status",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("products:write"),
  validateRequest({ body: moderateReviewSchema }),
  reviewController.moderateReview.bind(reviewController)
);

router.delete(
  "/admin/reviews/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("products:delete"),
  reviewController.deleteReview.bind(reviewController)
);

export const reviewRouter = router;
