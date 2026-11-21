import { Request, Response, NextFunction } from "express";
import { checkoutService } from "../services/checkout.service";

export class CheckoutController {
  public async validateCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shippingMethod = (req.query["shippingMethod"] as "standard" | "express") || "standard";
      const summary = await checkoutService.validateCheckout(
        req.user?.id,
        req.guestId,
        shippingMethod
      );
      res.status(200).json({
        success: true,
        data: summary,
        message: "Checkout validated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await checkoutService.createOrder(req.user?.id, req.guestId, req.body);
      res.status(201).json({
        success: true,
        data: order,
        message: "Order placed successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await checkoutService.getOrderById(
        req.params["orderId"]!,
        req.user?.id,
        req.guestId
      );
      res.status(200).json({
        success: true,
        data: order,
        message: "Order retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await checkoutService.listOrders(req.user?.id, req.guestId);
      res.status(200).json({
        success: true,
        data: orders,
        message: "Orders retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const checkoutController = new CheckoutController();
