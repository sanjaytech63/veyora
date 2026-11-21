import { Router } from "express";
import { wishlistController } from "./controllers/wishlist.controller";
import { optionalAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import { addToWishlistSchema, wishlistParamSchema } from "@veyora/validators";

const router = Router();

// Identify authenticated patron or guest session
router.use("/wishlist", optionalAuth);

// 1. Retrieve Current Wishlist
router.get("/wishlist", wishlistController.getWishlist.bind(wishlistController));

// 2. Add Item to Wishlist
router.post(
  "/wishlist/items",
  validate({ body: addToWishlistSchema }),
  wishlistController.addItem.bind(wishlistController)
);

// 3. Remove Item from Wishlist
router.delete(
  "/wishlist/items/:productId",
  validate({ params: wishlistParamSchema }),
  wishlistController.removeItem.bind(wishlistController)
);

// 4. Clear Entire Wishlist
router.delete("/wishlist", wishlistController.clearWishlist.bind(wishlistController));

export const wishlistRouter = router;
