/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service";
import { ApiPaymentCode } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

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

      sendSuccess(res, {
        statusCode: 200,
        code: ApiPaymentCode.PAYMENT_ORDER_CREATED,
        message: "Payment order initiated successfully.",
        data: initDto,
      });
    } catch (error) {
      next(error);
    }
  }

  public async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.verifyPayment(req.user?.id, req.guestId, req.body);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiPaymentCode.PAYMENT_VERIFIED,
        message: "Payment verified successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async retryPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.body;
      const initDto = await paymentService.retryPayment(orderId, req.user?.id, req.guestId);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiPaymentCode.PAYMENT_RETRY_INITIATED,
        message: "Payment retry initiated successfully.",
        data: initDto,
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

      sendSuccess(res, {
        statusCode: 200,
        code: ApiPaymentCode.PAYMENT_DETAILS_FETCHED,
        message: "Payment details retrieved successfully.",
        data: details,
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

      // Provider-protocol compliant acknowledgement adhering to Razorpay webhook semantics
      res.status(200).json({
        status: "ok",
        success: true,
        code: result.duplicate
          ? ApiPaymentCode.PAYMENT_WEBHOOK_IGNORED
          : ApiPaymentCode.PAYMENT_WEBHOOK_PROCESSED,
        message: result.message,
        ...(result.duplicate ? { duplicate: true } : {}),
      });
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

      sendSuccess(res, {
        statusCode: 200,
        code: ApiPaymentCode.REFUND_PROCESSED,
        message: "Refund processed successfully.",
        data: refundDto,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
