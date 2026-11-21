import { Router } from "express";
import { cartController } from "./controllers/cart.controller";
import { optionalAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import {
  addToCartSchema,
  updateCartItemSchema,
  cartItemParamSchema,
  applyCartCouponSchema,
  syncCartSchema,
} from "@veyora/validators";

const router = Router();

// Identify authenticated patron or guest session
router.use("/cart", optionalAuth);

// 1. Retrieve Current Shopping Bag
router.get("/cart", cartController.getCart.bind(cartController));

// 2. Add Item to Bag (Rigorous Product, Variant, Price, Stock validation)
router.post(
  "/cart/items",
  validate({ body: addToCartSchema }),
  cartController.addItem.bind(cartController)
);

// 3. Update Item Quantity
router.patch(
  "/cart/items/:itemId",
  validate({ params: cartItemParamSchema, body: updateCartItemSchema }),
  cartController.updateQuantity.bind(cartController)
);

// 4. Remove Item from Bag
router.delete(
  "/cart/items/:itemId",
  validate({ params: cartItemParamSchema }),
  cartController.removeItem.bind(cartController)
);

// 5. Clear Entire Bag
router.delete("/cart", cartController.clearCart.bind(cartController));

// 6. Apply Promotional / Privilege Code
router.post(
  "/cart/coupon",
  validate({ body: applyCartCouponSchema }),
  cartController.applyCoupon.bind(cartController)
);

// 7. Remove Promotional Code
router.delete("/cart/coupon", cartController.removeCoupon.bind(cartController));

// 8. Bulk Sync Client Bag
router.post(
  "/cart/sync",
  validate({ body: syncCartSchema }),
  cartController.syncCart.bind(cartController)
);

export const cartRouter = router;
