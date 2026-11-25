import { Request, Response, NextFunction } from "express";
import { checkoutService } from "../services/checkout.service";
import { AdminOrderListQuery, OrderStatus, ApiCheckoutCode, ApiOrderCode } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

export class CheckoutController {
  public async validateCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shippingMethod = (req.query["shippingMethod"] as "standard" | "express") || "standard";
      const summary = await checkoutService.validateCheckout(
        req.user?.id,
        req.guestId,
        shippingMethod
      );
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCheckoutCode.CHECKOUT_VALIDATED,
        message: "Checkout validated successfully.",
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  public async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await checkoutService.createOrder(req.user?.id, req.guestId, req.body);
      sendSuccess(res, {
        statusCode: 201,
        code: ApiOrderCode.ORDER_CREATED,
        message: "Order placed successfully.",
        data: order,
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
      sendSuccess(res, {
        statusCode: 200,
        code: ApiOrderCode.ORDER_FETCHED,
        message: "Order retrieved successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  public async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await checkoutService.listOrders(req.user?.id, req.guestId);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiOrderCode.ORDERS_FETCHED,
        message: "Orders retrieved successfully.",
        data: orders,
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
      sendSuccess(res, {
        statusCode: 200,
        code: ApiOrderCode.ORDER_CANCELLED,
        message: "Order cancelled successfully.",
        data: order,
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
      sendSuccess(res, {
        statusCode: 200,
        code: ApiOrderCode.ADMIN_ORDERS_FETCHED,
        message: "Admin orders retrieved successfully.",
        data: result,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
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
      sendSuccess(res, {
        statusCode: 200,
        code: ApiOrderCode.ADMIN_ORDER_FETCHED,
        message: "Admin order retrieved successfully.",
        data: order,
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

      sendSuccess(res, {
        statusCode: 200,
        code: ApiOrderCode.ORDER_STATUS_UPDATED,
        message: `Order status updated to ${body.status}.`,
        data: order,
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
      sendSuccess(res, {
        statusCode: 200,
        code: ApiOrderCode.ORDER_CANCELLED,
        message: "Order cancelled by administrator.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const checkoutController = new CheckoutController();
