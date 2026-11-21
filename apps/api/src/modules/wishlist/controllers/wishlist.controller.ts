import { Request, Response, NextFunction } from "express";
import { wishlistService } from "../services/wishlist.service";

export class WishlistController {
  public async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wishlist = await wishlistService.getWishlist(req.user?.id, req.guestId);
      res.status(200).json({
        success: true,
        data: wishlist,
        message: "Wishlist retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wishlist = await wishlistService.addItem(
        req.user?.id,
        req.guestId,
        req.body.productId
      );
      res.status(201).json({
        success: true,
        data: wishlist,
        message: "Garment saved to personal collection.",
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
      res.status(200).json({
        success: true,
        data: wishlist,
        message: "Garment removed from personal collection.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async clearWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wishlist = await wishlistService.clearWishlist(req.user?.id, req.guestId);
      res.status(200).json({
        success: true,
        data: wishlist,
        message: "Personal collection cleared successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const wishlistController = new WishlistController();
