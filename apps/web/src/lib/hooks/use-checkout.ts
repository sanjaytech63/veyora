"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkoutApi } from "../api/checkout-api";
import { checkoutKeys, cartKeys, orderKeys } from "../api/query-keys";
import { CheckoutValidationDto, CreateOrderPayload, OrderDto } from "@veyora/types";
import { notifyApiError, notifyApiSuccess } from "@/lib/notifications";

export function useCheckout(shippingMethod: "standard" | "express" = "standard") {
  const queryClient = useQueryClient();

  const validationQuery = useQuery<CheckoutValidationDto>({
    queryKey: checkoutKeys.validation(shippingMethod),
    queryFn: () => checkoutApi.validateCheckout(shippingMethod),
    staleTime: 1000 * 15, // 15 seconds
  });

  const placeOrderMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => checkoutApi.createOrder(payload),
    onSuccess: (order: OrderDto) => {
      // Invalidate cart so bag becomes empty across UI
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
      notifyApiSuccess(order);
    },
    onError: (error: Error) => {
      notifyApiError(error);
    },
  });

  const validation = validationQuery.data;

  return {
    validation,
    isValid: validation?.isValid ?? false,
    warnings: validation?.warnings ?? [],
    shippingOptions: validation?.shippingOptions ?? [],
    totals: validation?.totals,
    items: validation?.items ?? [],
    isLoading: validationQuery.isLoading,
    isError: validationQuery.isError,
    error: validationQuery.error,
    refetchValidation: validationQuery.refetch,
    placeOrder: placeOrderMutation.mutate,
    placeOrderAsync: placeOrderMutation.mutateAsync,
    isPlacingOrder: placeOrderMutation.isPending,
    orderResult: placeOrderMutation.data,
  };
}
