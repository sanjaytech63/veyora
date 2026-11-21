import { Router } from "express";
import { checkoutController } from "./controllers/checkout.controller";
import { optionalAuth, requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import {
  createOrderCheckoutSchema,
  cancelOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
} from "@veyora/validators";

const router = Router();

// ==========================================
// STOREFRONT & CUSTOMER ROUTES
// ==========================================
router.use("/checkout", optionalAuth);
router.use("/orders", optionalAuth);

// 1. Checkout validation & summary
router.get("/checkout/validate", checkoutController.validateCheckout.bind(checkoutController));

// 2. Order creation (Checkout submit)
router.post(
  "/checkout/orders",
  validate({ body: createOrderCheckoutSchema }),
  checkoutController.createOrder.bind(checkoutController)
);

// 3. Customer List Orders
router.get("/orders", checkoutController.listOrders.bind(checkoutController));

// 4. Customer Get Order Detail
router.get("/orders/:orderId", checkoutController.getOrder.bind(checkoutController));
router.get("/checkout/orders/:orderId", checkoutController.getOrder.bind(checkoutController));

// 5. Customer Cancel Order
router.post(
  "/orders/:orderId/cancel",
  validate({ body: cancelOrderSchema }),
  checkoutController.cancelOrder.bind(checkoutController)
);

// ==========================================
// ADMINISTRATOR ORDER ROUTES
// ==========================================
router.use("/admin/orders", requireAuth, requireRole("admin", "superadmin"));

// 6. Admin List Orders (with pagination, filters, search)
router.get(
  "/admin/orders",
  validate({ query: orderQuerySchema }),
  checkoutController.adminListOrders.bind(checkoutController)
);

// 7. Admin Get Single Order Detail
router.get("/admin/orders/:orderId", checkoutController.adminGetOrder.bind(checkoutController));

// 8. Admin Update Order Status (Strict State Machine & Tracking)
router.patch(
  "/admin/orders/:orderId/status",
  validate({ body: updateOrderStatusSchema }),
  checkoutController.adminUpdateOrderStatus.bind(checkoutController)
);

// 9. Admin Cancel Order
router.post(
  "/admin/orders/:orderId/cancel",
  validate({ body: cancelOrderSchema }),
  checkoutController.adminCancelOrder.bind(checkoutController)
);

export const checkoutRouter = router;
