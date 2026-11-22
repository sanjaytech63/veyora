/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from "mongoose";
import { Payment } from "../models/payment.model";
import { WebhookEvent } from "../models/webhook-event.model";
import { Order } from "../../checkout/models/order.model";
import { PaymentProviderFactory } from "../providers/payment-provider.factory";
import {
  PaymentProvider,
  PaymentOrderInitDto,
  VerifyPaymentPayload,
  PaymentVerificationResultDto,
  PaymentRefundDto,
  PaymentDetailsDto,
} from "@veyora/types";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  logger,
} from "@veyora/utils";
import crypto from "node:crypto";
import { notificationService } from "../../notification/services/notification.service";
import { queueRegistry } from "../../../infrastructure/queues/queue-registry";
import { eventPublisher } from "../../../infrastructure/events/event-publisher";

export class PaymentService {
  /**
   * 1. INITIATE PAYMENT ORDER
   */
  public async initiatePayment(
    orderIdOrNumber: string,
    userId: string | undefined,
    guestId: string | undefined,
    provider: PaymentProvider = "razorpay",
    currency = "INR"
  ): Promise<PaymentOrderInitDto> {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderIdOrNumber);
    const orderQuery: Record<string, any> = isObjectId
      ? { $or: [{ _id: new Types.ObjectId(orderIdOrNumber) }, { orderNumber: orderIdOrNumber.toUpperCase() }] }
      : { orderNumber: orderIdOrNumber.toUpperCase() };

    const order = await Order.findOne(orderQuery);
    if (!order) {
      throw new NotFoundError("Order not found with specified identifier.");
    }

    // Access control
    if (userId && order.userId && order.userId.toString() !== userId) {
      throw new NotFoundError("Order not found.");
    } else if (!userId && guestId && order.guestId && order.guestId !== guestId) {
      throw new NotFoundError("Order not found.");
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      throw new BadRequestError(`Cannot initiate payment for order in terminal status "${order.status}".`);
    }

    // Check if order already has a successful payment
    const existingSuccessfulPayment = await Payment.findOne({
      orderId: order._id,
      status: "successful",
    });
    if (existingSuccessfulPayment) {
      throw new ConflictError("Order has already been settled and paid successfully.");
    }

    const providerInstance = PaymentProviderFactory.getProvider(provider);
    const amountSubunits = Math.round(order.total * 100);

    // Create provider gateway order
    const gatewayResult = await providerInstance.createPaymentOrder({
      amountSubunits,
      currency: currency.toUpperCase(),
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
      },
    });

    // Check for existing pending/failed payment to reuse or increment attempts
    let payment = await Payment.findOne({
      orderId: order._id,
      status: { $in: ["pending", "processing", "failed"] },
    });

    if (payment) {
      payment.attemptCount += 1;
      payment.provider = provider;
      payment.gatewayOrderId = gatewayResult.gatewayOrderId;
      payment.amount = order.total;
      payment.currency = currency.toUpperCase();
      payment.status = "pending";
      payment.error = null;
    } else {
      payment = new Payment({
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: order.userId || null,
        guestId: order.guestId || null,
        provider,
        gatewayOrderId: gatewayResult.gatewayOrderId,
        amount: order.total,
        currency: currency.toUpperCase(),
        status: "pending",
        attemptCount: 1,
        refunds: [],
        metadata: {
          customerEmail: order.customerEmail,
          customerName: order.customerName,
        },
      });
    }

    await payment.save();

    return {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      paymentId: payment._id.toString(),
      provider,
      gatewayOrderId: gatewayResult.gatewayOrderId,
      amount: order.total,
      amountSubunits,
      currency: currency.toUpperCase(),
      keyId: providerInstance.keyId,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.shippingAddress.phone || undefined,
      },
    };
  }

  /**
   * 2. SERVER-SIDE PAYMENT SIGNATURE VERIFICATION
   * NEVER trust client payment success claims without cryptographic verification!
   */
  public async verifyPayment(
    userId: string | undefined,
    guestId: string | undefined,
    payload: VerifyPaymentPayload
  ): Promise<PaymentVerificationResultDto> {
    const isObjectId = mongoose.Types.ObjectId.isValid(payload.orderId);
    const orderQuery: Record<string, any> = isObjectId
      ? { $or: [{ _id: new Types.ObjectId(payload.orderId) }, { orderNumber: payload.orderId.toUpperCase() }] }
      : { orderNumber: payload.orderId.toUpperCase() };

    const order = await Order.findOne(orderQuery);
    if (!order) {
      throw new NotFoundError("Order not found with specified identifier.");
    }

    // Access control
    if (userId && order.userId && order.userId.toString() !== userId) {
      throw new NotFoundError("Order not found.");
    } else if (!userId && guestId && order.guestId && order.guestId !== guestId) {
      throw new NotFoundError("Order not found.");
    }

    const payment = await Payment.findOne({
      orderId: order._id,
      gatewayOrderId: payload.gatewayOrderId,
    });

    if (!payment) {
      throw new NotFoundError("Payment record not found for this gateway order.");
    }

    // Server-side cryptographic signature check
    const providerInstance = PaymentProviderFactory.getProvider(payment.provider);
    const isValidSignature = providerInstance.verifyPaymentSignature({
      orderId: payload.gatewayOrderId,
      paymentId: payload.gatewayPaymentId,
      signature: payload.gatewaySignature,
    });

    if (!isValidSignature) {
      payment.status = "failed";
      payment.error = {
        code: "INVALID_SIGNATURE",
        description: "Payment verification failed: cryptographic signature mismatch.",
        timestamp: new Date(),
      };
      await payment.save();

      logger.warn(
        "PAYMENT_SECURITY",
        "Potential payment tampering detected. Cryptographic signature check failed.",
        { orderId: order._id.toString(), gatewayOrderId: payload.gatewayOrderId }
      );

      throw new BadRequestError("Payment verification failed. Invalid gateway signature.");
    }

    // Transition payment to successful
    payment.status = "successful";
    payment.gatewayPaymentId = payload.gatewayPaymentId;
    payment.gatewaySignature = payload.gatewaySignature;
    payment.error = null;
    await payment.save();

    // Transition Order from pending -> confirmed if currently pending
    if (order.status === "pending") {
      order.status = "confirmed";
      order.statusHistory.push({
        fromStatus: "pending",
        toStatus: "confirmed",
        changedBy: userId || guestId || "system",
        role: "customer",
        reason: `Payment verified via ${payment.provider.toUpperCase()} (${payload.gatewayPaymentId})`,
        timestamp: new Date(),
      });
      await order.save();
    }

    // Publish real-time notification & enqueue payment confirmation email
    try {
      if (order.userId) {
        await notificationService.createNotification({
          userId: order.userId.toString(),
          type: "payment",
          title: "Payment Confirmed",
          message: `Payment of ₹${payment.amount} for Order #${order.orderNumber} was successfully verified.`,
          actionUrl: `/orders/${order._id.toString()}`,
          idempotencyKey: `payment-verified:${payment._id.toString()}`,
        });
      }

      await queueRegistry.addEmailJob({
        type: "payment-confirmation",
        recipient: order.customerEmail,
        recipientName: order.customerName,
        data: {
          orderNumber: order.orderNumber,
          amount: payment.amount,
          method: payment.provider,
        },
        idempotencyKey: `email:payment-conf:${payment._id.toString()}`,
      });

      eventPublisher.publishPaymentUpdate({
        id: payment._id.toString(),
        orderId: order._id.toString(),
        status: payment.status,
        amount: payment.amount,
        userId: order.userId?.toString(),
      });
    } catch {
      // Non-critical background event
    }

    return {
      success: true,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      paymentId: payment._id.toString(),
      gatewayPaymentId: payload.gatewayPaymentId,
      status: payment.status,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * 3. WEBHOOK EVENT HANDLER (IDEMPOTENT & SIGNATURE-VERIFIED)
   */
  public async handleWebhook(
    provider: PaymentProvider,
    rawBody: string,
    signature: string,
    eventPayload: Record<string, any>
  ): Promise<{ success: boolean; message: string; duplicate?: boolean }> {
    const providerInstance = PaymentProviderFactory.getProvider(provider);

    // 1. Verify Webhook Signature
    const isValidSignature = providerInstance.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      logger.warn("WEBHOOK_SECURITY", "Received webhook with invalid signature.", { provider });
      throw new UnauthorizedError("Invalid webhook signature.");
    }

    // 2. Extract Event ID for Idempotency
    const eventId =
      eventPayload.id ||
      eventPayload.payload?.payment?.entity?.id ||
      eventPayload.payload?.order?.entity?.id ||
      `evt_${crypto.createHash("sha256").update(rawBody).digest("hex").slice(0, 24)}`;

    const eventType = eventPayload.event || "unknown";

    // 3. Idempotency Check: reject duplicate processing
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      logger.info("WEBHOOK", "Webhook event already processed (idempotent ACK).", { eventId, eventType });
      return { success: true, message: "Webhook already processed.", duplicate: true };
    }

    // 4. Record Webhook Event
    const webhookDoc = new WebhookEvent({
      eventId,
      provider,
      eventType,
      payload: eventPayload,
      status: "processed",
      processedAt: new Date(),
    });
    await webhookDoc.save();

    // 5. Handle Provider Events
    try {
      if (eventType === "order.paid" || eventType === "payment.captured") {
        const paymentEntity = eventPayload.payload?.payment?.entity || eventPayload.payload?.order?.entity;
        const gatewayOrderId = paymentEntity?.order_id || paymentEntity?.id;
        const gatewayPaymentId = paymentEntity?.id;

        if (gatewayOrderId) {
          const payment = await Payment.findOne({ gatewayOrderId });
          if (payment) {
            payment.status = "successful";
            if (gatewayPaymentId) payment.gatewayPaymentId = gatewayPaymentId;
            await payment.save();

            const order = await Order.findById(payment.orderId);
            if (order && order.status === "pending") {
              order.status = "confirmed";
              order.statusHistory.push({
                fromStatus: "pending",
                toStatus: "confirmed",
                changedBy: "webhook",
                role: "system",
                reason: `Payment confirmed via webhook (${eventType})`,
                timestamp: new Date(),
              });
              await order.save();
            }
          }
        }
      } else if (eventType === "payment.failed") {
        const paymentEntity = eventPayload.payload?.payment?.entity;
        const gatewayOrderId = paymentEntity?.order_id;
        if (gatewayOrderId) {
          const payment = await Payment.findOne({ gatewayOrderId });
          if (payment && payment.status === "pending") {
            payment.status = "failed";
            payment.error = {
              code: paymentEntity?.error_code || "PAYMENT_FAILED",
              description: paymentEntity?.error_description || "Payment failed via gateway webhook.",
              timestamp: new Date(),
            };
            await payment.save();
          }
        }
      } else if (eventType === "refund.processed") {
        const refundEntity = eventPayload.payload?.refund?.entity;
        const gatewayPaymentId = refundEntity?.payment_id;
        if (gatewayPaymentId) {
          const payment = await Payment.findOne({ gatewayPaymentId });
          if (payment) {
            const refundAmount = Number(refundEntity.amount) / 100;
            const existingRefund = payment.refunds.find((r) => r.gatewayRefundId === refundEntity.id);
            if (!existingRefund) {
              payment.refunds.push({
                refundId: `ref_${crypto.randomBytes(6).toString("hex")}`,
                gatewayRefundId: refundEntity.id,
                amount: refundAmount,
                reason: refundEntity.notes?.reason || "Webhook refund processed",
                status: "processed",
                createdAt: new Date(),
              });
            }

            const totalRefunded = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
            payment.status = totalRefunded >= payment.amount ? "refunded" : "partially_refunded";
            await payment.save();

            const order = await Order.findById(payment.orderId);
            if (order) {
              order.status = totalRefunded >= order.total ? "refunded" : "refund_pending";
              order.statusHistory.push({
                fromStatus: order.status,
                toStatus: totalRefunded >= order.total ? "refunded" : "refund_pending",
                changedBy: "webhook",
                role: "system",
                reason: `Refund of $${refundAmount} confirmed via gateway webhook.`,
                timestamp: new Date(),
              });
              await order.save();
            }
          }
        }
      }
    } catch (err: any) {
      webhookDoc.status = "failed";
      webhookDoc.error = err.message || "Failed processing webhook event.";
      await webhookDoc.save();
      logger.error("WEBHOOK", "Error processing webhook business logic.", { err, eventId });
    }

    return { success: true, message: "Webhook processed successfully." };
  }

  /**
   * 4. RETRY PAYMENT
   */
  public async retryPayment(
    orderIdOrNumber: string,
    userId: string | undefined,
    guestId: string | undefined
  ): Promise<PaymentOrderInitDto> {
    return this.initiatePayment(orderIdOrNumber, userId, guestId, "razorpay");
  }

  /**
   * 5. INITIATE REFUND (ADMIN OR RETURN)
   */
  public async initiateRefund(
    orderIdOrNumber: string,
    amount: number | undefined,
    reason: string | undefined,
    adminUser: { id: string; email?: string }
  ): Promise<PaymentRefundDto> {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderIdOrNumber);
    const orderQuery: Record<string, any> = isObjectId
      ? { $or: [{ _id: new Types.ObjectId(orderIdOrNumber) }, { orderNumber: orderIdOrNumber.toUpperCase() }] }
      : { orderNumber: orderIdOrNumber.toUpperCase() };

    const order = await Order.findOne(orderQuery);
    if (!order) {
      throw new NotFoundError("Order not found with specified identifier.");
    }

    const payment = await Payment.findOne({
      orderId: order._id,
      status: { $in: ["successful", "partially_refunded", "refunded"] },
    });

    if (!payment) {
      throw new BadRequestError("No successful payment found to refund for this order.");
    }

    if (!payment.gatewayPaymentId) {
      throw new BadRequestError("Payment does not have a valid gateway payment identifier.");
    }

    const currentRefunded = payment.refunds.reduce((acc, r) => acc + r.amount, 0);
    const remainingBalance = Math.round((payment.amount - currentRefunded) * 100) / 100;

    if (remainingBalance <= 0) {
      throw new BadRequestError("This order has already been fully refunded.");
    }

    const refundAmount = amount ? Math.min(amount, remainingBalance) : remainingBalance;
    const amountSubunits = Math.round(refundAmount * 100);

    const providerInstance = PaymentProviderFactory.getProvider(payment.provider);
    const refundResult = await providerInstance.initiateRefund({
      paymentId: payment.gatewayPaymentId,
      amountSubunits,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        reason: reason || "Customer request",
      },
    });

    const refundId = `ref_${crypto.randomBytes(6).toString("hex")}`;
    const refundRecord = {
      refundId,
      gatewayRefundId: refundResult.gatewayRefundId,
      amount: refundAmount,
      reason: reason || "Administrator initiated refund",
      status: "processed" as const,
      createdAt: new Date(),
    };

    payment.refunds.push(refundRecord);
    const newTotalRefunded = currentRefunded + refundAmount;

    if (newTotalRefunded >= payment.amount) {
      payment.status = "refunded";
      order.status = "refunded";
    } else {
      payment.status = "partially_refunded";
    }

    order.statusHistory.push({
      fromStatus: order.status,
      toStatus: order.status,
      changedBy: adminUser.email || adminUser.id,
      role: "admin",
      reason: `Refund of $${refundAmount.toFixed(2)} processed (${reason || "Atelier return"})`,
      timestamp: new Date(),
    });

    await Promise.all([payment.save(), order.save()]);

    return {
      refundId,
      gatewayRefundId: refundResult.gatewayRefundId,
      orderId: order._id.toString(),
      amount: refundAmount,
      reason: refundRecord.reason,
      status: refundRecord.status,
      createdAt: refundRecord.createdAt.toISOString(),
    };
  }

  /**
   * 6. GET PAYMENT DETAILS
   */
  public async getPaymentDetails(
    orderIdOrNumber: string,
    userId: string | undefined,
    guestId: string | undefined,
    isAdmin = false
  ): Promise<PaymentDetailsDto> {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderIdOrNumber);
    const orderQuery: Record<string, any> = isObjectId
      ? { $or: [{ _id: new Types.ObjectId(orderIdOrNumber) }, { orderNumber: orderIdOrNumber.toUpperCase() }] }
      : { orderNumber: orderIdOrNumber.toUpperCase() };

    const order = await Order.findOne(orderQuery);
    if (!order) {
      throw new NotFoundError("Order not found with specified identifier.");
    }

    if (!isAdmin) {
      if (userId && order.userId && order.userId.toString() !== userId) {
        throw new NotFoundError("Order not found.");
      } else if (!userId && guestId && order.guestId && order.guestId !== guestId) {
        throw new NotFoundError("Order not found.");
      }
    }

    const payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });
    if (!payment) {
      throw new NotFoundError("No payment record found for this order.");
    }

    return {
      id: payment._id.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      provider: payment.provider,
      gatewayOrderId: payment.gatewayOrderId,
      gatewayPaymentId: payment.gatewayPaymentId || undefined,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      attemptCount: payment.attemptCount,
      refunds: payment.refunds.map((r) => ({
        refundId: r.refundId,
        gatewayRefundId: r.gatewayRefundId,
        orderId: order._id.toString(),
        amount: r.amount,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}

export const paymentService = new PaymentService();
