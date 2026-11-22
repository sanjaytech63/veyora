import { Request, Response, NextFunction } from "express";
import { checkoutService } from "../services/checkout.service";
import { AdminOrderListQuery, OrderStatus } from "@veyora/types";

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

  public async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await checkoutService.cancelOrder(
        req.params["orderId"]!,
        req.user?.id,
        req.guestId,
        req.body?.reason,
        false
      );
      res.status(200).json({
        success: true,
        data: order,
        message: "Order cancelled successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN ORDER ENDPOINTS
  // ==========================================

  public async adminListOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: AdminOrderListQuery = {
        page: req.query["page"] ? Number(req.query["page"]) : 1,
        limit: req.query["limit"] ? Number(req.query["limit"]) : 20,
        status: (req.query["status"] as OrderStatus) || undefined,
        search: (req.query["search"] as string) || undefined,
        startDate: (req.query["startDate"] as string) || undefined,
        endDate: (req.query["endDate"] as string) || undefined,
      };

      const result = await checkoutService.adminListOrders(query);
      res.status(200).json({
        success: true,
        data: result,
        message: "Admin orders retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async adminGetOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await checkoutService.getOrderById(
        req.params["orderId"]!,
        undefined,
        undefined,
        true
      );
      res.status(200).json({
        success: true,
        data: order,
        message: "Admin order retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async adminUpdateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminUser = {
        id: req.user?.id || "admin",
        email: req.user?.email || "admin@veyora.internal",
        role: req.user?.role || "admin",
      };

      const body = req.body;
      const carrier = body.trackingCarrier || body.tracking?.carrier || body.carrier;
      const trackingNumber = body.trackingNumber || body.tracking?.trackingNumber;
      const trackingUrl = body.trackingUrl || body.tracking?.trackingUrl;
      const estimatedDeliveryDate =
        body.estimatedDeliveryDate || body.tracking?.estimatedDeliveryDate;
      const reason = body.reason || body.notes;

      const order = await checkoutService.updateOrderStatus(
        req.params["orderId"]!,
        body.status,
        adminUser,
        {
          reason,
          carrier,
          trackingNumber,
          trackingUrl,
          estimatedDeliveryDate,
        }
      );

      res.status(200).json({
        success: true,
        data: order,
        message: `Order status updated to ${body.status}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  public async adminCancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await checkoutService.cancelOrder(
        req.params["orderId"]!,
        req.user?.id,
        undefined,
        req.body?.reason,
        true
      );
      res.status(200).json({
        success: true,
        data: order,
        message: "Order cancelled by administrator.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const checkoutController = new CheckoutController();
