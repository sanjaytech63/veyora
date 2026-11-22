/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service";

export class PaymentController {
  public async initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, provider, currency } = req.body;
      const initDto = await paymentService.initiatePayment(
        orderId,
        req.user?.id,
        req.guestId,
        provider,
        currency
      );

      res.status(200).json({
        success: true,
        data: initDto,
        message: "Payment order initiated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.verifyPayment(req.user?.id, req.guestId, req.body);

      res.status(200).json({
        success: true,
        data: result,
        message: "Payment verified successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async retryPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.body;
      const initDto = await paymentService.retryPayment(orderId, req.user?.id, req.guestId);

      res.status(200).json({
        success: true,
        data: initDto,
        message: "Payment retry initiated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      const details = await paymentService.getPaymentDetails(
        orderId!,
        req.user?.id,
        req.guestId,
        req.user?.role === "admin" || req.user?.role === "superadmin"
      );

      res.status(200).json({
        success: true,
        data: details,
        message: "Payment details retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async handleRazorpayWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = (req.headers["x-razorpay-signature"] as string) || "";
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const result = await paymentService.handleWebhook("razorpay", rawBody, signature, req.body);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async adminRefundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = req.params.orderId || req.body.orderId;
      const { amount, reason } = req.body;
      const adminUser = {
        id: req.user?.id || "admin",
        email: req.user?.email,
      };

      const refundDto = await paymentService.initiateRefund(orderId, amount, reason, adminUser);

      res.status(200).json({
        success: true,
        data: refundDto,
        message: "Refund processed successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
