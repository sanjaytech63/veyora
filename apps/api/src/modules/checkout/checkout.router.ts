import { Router } from "express";
import { checkoutController } from "./controllers/checkout.controller";
import { optionalAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import { createOrderCheckoutSchema } from "@veyora/validators";

const router = Router();

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

// 3. List Orders
router.get("/orders", checkoutController.listOrders.bind(checkoutController));

// 4. Get Order Detail (available via /orders/:orderId and /checkout/orders/:orderId)
router.get("/orders/:orderId", checkoutController.getOrder.bind(checkoutController));
router.get("/checkout/orders/:orderId", checkoutController.getOrder.bind(checkoutController));

export const checkoutRouter = router;
