import { Request, Response, NextFunction } from "express";
import { cartService } from "../services/cart.service";

export class CartController {
  public async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.getCart(req.user?.id, req.guestId);
      res.status(200).json({
        success: true,
        data: cart,
        message: "Shopping cart retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.addItem(req.user?.id, req.guestId, req.body);
      res.status(201).json({
        success: true,
        data: cart,
        message: "Garment added to shopping bag.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.updateItemQuantity(
        req.user?.id,
        req.guestId,
        req.params["itemId"]!,
        req.body.quantity
      );
      res.status(200).json({
        success: true,
        data: cart,
        message: "Bag item quantity updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.removeItem(
        req.user?.id,
        req.guestId,
        req.params["itemId"]!
      );
      res.status(200).json({
        success: true,
        data: cart,
        message: "Garment removed from shopping bag.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.clearCart(req.user?.id, req.guestId);
      res.status(200).json({
        success: true,
        data: cart,
        message: "Shopping bag cleared successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async applyCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.applyCoupon(req.user?.id, req.guestId, req.body.code);
      res.status(200).json({
        success: true,
        data: cart,
        message: "Promotional privilege code applied successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async removeCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.removeCoupon(req.user?.id, req.guestId);
      res.status(200).json({
        success: true,
        data: cart,
        message: "Coupon removed successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async syncCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.syncCart(req.user?.id, req.guestId, req.body.items);
      res.status(200).json({
        success: true,
        data: cart,
        message: "Shopping bag synchronized successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();
