import { Request, Response, NextFunction } from "express";
import { wishlistService } from "../services/wishlist.service";
import { sendSuccess } from "../../../utils/response";

export class WishlistController {
  public async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wishlist = await wishlistService.getWishlist(req.user?.id, req.guestId);
      sendSuccess(res, {
        statusCode: 200,
        code: "WISHLIST_FETCHED",
        message: "Wishlist retrieved successfully.",
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  public async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wishlist = await wishlistService.addItem(req.user?.id, req.guestId, req.body.productId);
      sendSuccess(res, {
        statusCode: 201,
        code: "WISHLIST_ITEM_ADDED",
        message: "Garment saved to personal collection.",
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  public async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wishlist = await wishlistService.removeItem(
        req.user?.id,
        req.guestId,
        req.params["productId"]!
      );
      sendSuccess(res, {
        statusCode: 200,
        code: "WISHLIST_ITEM_REMOVED",
        message: "Garment removed from personal collection.",
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  public async clearWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wishlist = await wishlistService.clearWishlist(req.user?.id, req.guestId);
      sendSuccess(res, {
        statusCode: 200,
        code: "WISHLIST_CLEARED",
        message: "Personal collection cleared successfully.",
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const wishlistController = new WishlistController();
