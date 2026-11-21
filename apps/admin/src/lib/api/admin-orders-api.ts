import { apiClient } from "./api-client";
import {
  OrderDto,
  PaginatedOrdersDto,
  AdminOrderListQuery,
  UpdateOrderStatusPayload,
  CancelOrderPayload,
} from "@veyora/types";

export const adminOrdersApi = {
  listOrders: (query?: AdminOrderListQuery): Promise<PaginatedOrdersDto> =>
    apiClient.get<PaginatedOrdersDto>("/admin/orders", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getOrder: (orderId: string): Promise<OrderDto> =>
    apiClient.get<OrderDto>(`/admin/orders/${orderId}`),

  updateOrderStatus: (orderId: string, payload: UpdateOrderStatusPayload): Promise<OrderDto> =>
    apiClient.patch<OrderDto>(`/admin/orders/${orderId}/status`, payload),

  cancelOrder: (orderId: string, payload?: CancelOrderPayload): Promise<OrderDto> =>
    apiClient.post<OrderDto>(`/admin/orders/${orderId}/cancel`, payload || {}),
};
