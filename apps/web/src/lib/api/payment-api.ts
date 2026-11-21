import { apiClient } from "./api-client";
import {
  PaymentOrderInitDto,
  VerifyPaymentPayload,
  PaymentVerificationResultDto,
  PaymentDetailsDto,
  PaymentProvider,
} from "@veyora/types";

export interface InitiatePaymentRequest {
  orderId: string;
  provider?: PaymentProvider;
  currency?: string;
}

export interface RetryPaymentRequest {
  orderId: string;
}

export const paymentApi = {
  initiatePayment(payload: InitiatePaymentRequest): Promise<PaymentOrderInitDto> {
    return apiClient.post<PaymentOrderInitDto>("/payments/initiate", payload);
  },

  verifyPayment(payload: VerifyPaymentPayload): Promise<PaymentVerificationResultDto> {
    return apiClient.post<PaymentVerificationResultDto>("/payments/verify", payload);
  },

  retryPayment(payload: RetryPaymentRequest): Promise<PaymentOrderInitDto> {
    return apiClient.post<PaymentOrderInitDto>("/payments/retry", payload);
  },

  getPaymentStatus(orderId: string): Promise<PaymentDetailsDto> {
    return apiClient.get<PaymentDetailsDto>(`/payments/status/${orderId}`);
  },
};
