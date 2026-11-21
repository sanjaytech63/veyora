import { Router } from "express";
import { paymentController } from "./controllers/payment.controller";
import { optionalAuth, requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import {
  initiatePaymentSchema,
  verifyPaymentSchema,
  retryPaymentSchema,
  refundPaymentSchema,
} from "@veyora/validators";

const router = Router();

// ==========================================
// STOREFRONT & CUSTOMER PAYMENT ENDPOINTS
// ==========================================

router.post(
  "/payments/initiate",
  optionalAuth,
  validate({ body: initiatePaymentSchema }),
  paymentController.initiatePayment.bind(paymentController)
);

router.post(
  "/payments/verify",
  optionalAuth,
  validate({ body: verifyPaymentSchema }),
  paymentController.verifyPayment.bind(paymentController)
);

router.post(
  "/payments/retry",
  optionalAuth,
  validate({ body: retryPaymentSchema }),
  paymentController.retryPayment.bind(paymentController)
);

router.get(
  "/payments/status/:orderId",
  optionalAuth,
  paymentController.getPaymentStatus.bind(paymentController)
);

// ==========================================
// PAYMENT WEBHOOKS (IDEMPOTENT & SIGNED)
// ==========================================

router.post(
  "/payments/webhook/razorpay",
  paymentController.handleRazorpayWebhook.bind(paymentController)
);

// ==========================================
// ADMINISTRATOR REFUND ENDPOINTS
// ==========================================

router.post(
  "/admin/payments/:orderId/refund",
  requireAuth,
  requireRole("admin", "superadmin"),
  validate({ body: refundPaymentSchema }),
  paymentController.adminRefundPayment.bind(paymentController)
);

export const paymentRouter = router;
