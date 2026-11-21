import { apiClient } from "./api-client";
import {
  CheckoutValidationDto,
  OrderDto,
  CreateOrderPayload,
  CancelOrderPayload,
} from "@veyora/types";

export const checkoutApi = {
  validateCheckout(shippingMethod: "standard" | "express" = "standard"): Promise<CheckoutValidationDto> {
    return apiClient.get<CheckoutValidationDto>("/checkout/validate", {
      params: { shippingMethod },
    });
  },

  createOrder(payload: CreateOrderPayload): Promise<OrderDto> {
    return apiClient.post<OrderDto>("/checkout/orders", payload);
  },

  getOrder(orderId: string): Promise<OrderDto> {
    return apiClient.get<OrderDto>(`/orders/${orderId}`);
  },

  listOrders(): Promise<OrderDto[]> {
    return apiClient.get<OrderDto[]>("/orders");
  },

  cancelOrder(orderId: string, payload?: CancelOrderPayload): Promise<OrderDto> {
    return apiClient.post<OrderDto>(`/orders/${orderId}/cancel`, payload || {});
  },
};
