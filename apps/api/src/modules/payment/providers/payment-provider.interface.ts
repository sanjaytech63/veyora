export interface CreateGatewayOrderParams {
  amountSubunits: number; // In paise for INR, cents for USD
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  gatewayOrderId: string;
  amountSubunits: number;
  currency: string;
  receipt: string;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface CreateRefundParams {
  paymentId: string;
  amountSubunits?: number;
  notes?: Record<string, string>;
}

export interface GatewayRefundResult {
  gatewayRefundId: string;
  paymentId: string;
  amountSubunits: number;
  status: string;
}

export interface IPaymentProvider {
  readonly providerName: string;
  readonly keyId: string;

  createPaymentOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult>;
  verifyPaymentSignature(params: VerifySignatureParams): boolean;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  initiateRefund(params: CreateRefundParams): Promise<GatewayRefundResult>;
}
