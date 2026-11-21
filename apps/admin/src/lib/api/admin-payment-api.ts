import { apiClient } from "./api-client";
import { PaymentRefundDto, PaymentDetailsDto } from "@veyora/types";

export interface AdminRefundPayload {
  amount?: number;
  reason?: string;
}

export const adminPaymentApi = {
  refundPayment(orderId: string, payload: AdminRefundPayload): Promise<PaymentRefundDto> {
    return apiClient.post<PaymentRefundDto>(`/admin/payments/${orderId}/refund`, payload);
  },

  getPaymentStatus(orderId: string): Promise<PaymentDetailsDto> {
    return apiClient.get<PaymentDetailsDto>(`/payments/status/${orderId}`);
  },
};
