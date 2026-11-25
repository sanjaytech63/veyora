import { Request, Response, NextFunction } from "express";
import { cartService } from "../services/cart.service";
import { sendSuccess } from "../../../utils/response";

export class CartController {
  public async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.getCart(req.user?.id, req.guestId);
      sendSuccess(res, {
        statusCode: 200,
        code: "CART_FETCHED",
        message: "Shopping cart retrieved successfully.",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  public async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.addItem(req.user?.id, req.guestId, req.body);
      sendSuccess(res, {
        statusCode: 201,
        code: "CART_ITEM_ADDED",
        message: "Garment added to shopping bag.",
        data: cart,
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
      sendSuccess(res, {
        statusCode: 200,
        code: "CART_ITEM_UPDATED",
        message: "Bag item quantity updated successfully.",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  public async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.removeItem(req.user?.id, req.guestId, req.params["itemId"]!);
      sendSuccess(res, {
        statusCode: 200,
        code: "CART_ITEM_REMOVED",
        message: "Garment removed from shopping bag.",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  public async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.clearCart(req.user?.id, req.guestId);
      sendSuccess(res, {
        statusCode: 200,
        code: "CART_CLEARED",
        message: "Shopping bag cleared successfully.",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  public async applyCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.applyCoupon(req.user?.id, req.guestId, req.body.code);
      sendSuccess(res, {
        statusCode: 200,
        code: "COUPON_APPLIED",
        message: "Promotional privilege code applied successfully.",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  public async removeCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.removeCoupon(req.user?.id, req.guestId);
      sendSuccess(res, {
        statusCode: 200,
        code: "COUPON_REMOVED",
        message: "Coupon removed successfully.",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  public async syncCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.syncCart(req.user?.id, req.guestId, req.body.items);
      sendSuccess(res, {
        statusCode: 200,
        code: "CART_SYNCED",
        message: "Shopping bag synchronized successfully.",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();
