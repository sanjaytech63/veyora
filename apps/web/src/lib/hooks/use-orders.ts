"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkoutApi } from "../api/checkout-api";
import { orderKeys } from "../api/query-keys";
import { OrderDto, CancelOrderPayload } from "@veyora/types";
import { notifyApiError, notifyApiSuccess } from "@/lib/notifications";

export function useOrders() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery<OrderDto[]>({
    queryKey: orderKeys.list(),
    queryFn: () => checkoutApi.listOrders(),
    staleTime: 1000 * 30, // 30 seconds
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload?: CancelOrderPayload }) =>
      checkoutApi.cancelOrder(orderId, payload),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(updatedOrder.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(updatedOrder.orderNumber) });
      notifyApiSuccess(updatedOrder);
    },
    onError: (err: Error) => {
      notifyApiError(err);
    },
  });

  return {
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    isError: ordersQuery.isError,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,
    cancelOrder: (orderId: string, payload?: CancelOrderPayload) =>
      cancelOrderMutation.mutate({ orderId, payload }),
    cancelOrderAsync: (orderId: string, payload?: CancelOrderPayload) =>
      cancelOrderMutation.mutateAsync({ orderId, payload }),
    isCancelling: cancelOrderMutation.isPending,
  };
}

export function useOrderDetail(orderId: string) {
  const queryClient = useQueryClient();

  const orderQuery = useQuery<OrderDto>({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => checkoutApi.getOrder(orderId),
    enabled: Boolean(orderId),
    staleTime: 1000 * 30,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (payload?: CancelOrderPayload) => checkoutApi.cancelOrder(orderId, payload),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
      queryClient.setQueryData(orderKeys.detail(orderId), updatedOrder);
      notifyApiSuccess(updatedOrder);
    },
    onError: (err: Error) => {
      notifyApiError(err);
    },
  });

  return {
    order: orderQuery.data,
    isLoading: orderQuery.isLoading,
    isError: orderQuery.isError,
    error: orderQuery.error,
    refetch: orderQuery.refetch,
    cancelOrder: (payload?: CancelOrderPayload) => cancelOrderMutation.mutate(payload),
    cancelOrderAsync: (payload?: CancelOrderPayload) => cancelOrderMutation.mutateAsync(payload),
    isCancelling: cancelOrderMutation.isPending,
  };
}
