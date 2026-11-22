/**
 * Payment Domain Types for Veyora
 */

export type PaymentProvider = "razorpay" | "stripe" | "cod";

export type PaymentStatus =
  "pending" | "processing" | "successful" | "failed" | "refunded" | "partially_refunded";

export type RefundStatus = "pending" | "processed" | "failed";

export interface PaymentOrderInitDto {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  provider: PaymentProvider;
  gatewayOrderId: string;
  amount: number;
  amountSubunits: number; // In paise for INR, cents for USD
  currency: string;
  keyId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface VerifyPaymentPayload {
  orderId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
}

export interface PaymentVerificationResultDto {
  success: boolean;
  orderId: string;
  orderNumber: string;
  paymentId: string;
  gatewayPaymentId?: string;
  status: PaymentStatus;
  verifiedAt: string;
}

export interface InitiatePaymentPayload {
  orderId: string;
  provider?: PaymentProvider;
  currency?: string;
}

export interface RetryPaymentPayload {
  orderId: string;
}

export interface RefundPayload {
  orderId: string;
  amount?: number;
  reason?: string;
}

export interface PaymentRefundDto {
  refundId: string;
  gatewayRefundId: string;
  orderId: string;
  amount: number;
  reason?: string;
  status: RefundStatus;
  createdAt: string;
}

export interface PaymentDetailsDto {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: PaymentProvider;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  attemptCount: number;
  refunds: PaymentRefundDto[];
  createdAt: string;
  updatedAt: string;
}
