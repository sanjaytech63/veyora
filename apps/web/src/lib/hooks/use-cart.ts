"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "../api/cart-api";
import { cartKeys } from "../api/query-keys";
import { CartDto, AddToCartPayload, ApplyCouponPayload } from "@veyora/types";
import { notifyApiError, notifyApiSuccess } from "@/lib/notifications";

export function useCart() {
  const queryClient = useQueryClient();

  const cartQuery = useQuery<CartDto>({
    queryKey: cartKeys.current(),
    queryFn: () => cartApi.getCart(),
    staleTime: 1000 * 30, // 30 seconds
  });

  const addToCartMutation = useMutation({
    mutationFn: (payload: AddToCartPayload) => cartApi.addToCart(payload),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.current(), updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      notifyApiSuccess(updatedCart);
    },
    onError: (error: Error) => {
      notifyApiError(error);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateCartItem(itemId, { quantity }),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.current(), updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
    onError: (error: Error) => {
      notifyApiError(error);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => cartApi.removeCartItem(itemId),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.current(), updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      notifyApiSuccess(updatedCart);
    },
    onError: (error: Error) => {
      notifyApiError(error);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.current(), updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      notifyApiSuccess(updatedCart);
    },
    onError: (error: Error) => {
      notifyApiError(error);
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: (payload: ApplyCouponPayload) => cartApi.applyCoupon(payload),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.current(), updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      notifyApiSuccess(updatedCart);
    },
    onError: (error: Error) => {
      notifyApiError(error);
    },
  });

  const removeCouponMutation = useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.current(), updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      notifyApiSuccess(updatedCart);
    },
    onError: (error: Error) => {
      notifyApiError(error);
    },
  });

  const cart = cartQuery.data;
  const items = cart?.items || [];
  const totals = cart?.totals || {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    estimatedTax: 0,
    total: 0,
    itemCount: 0,
    freeShippingThreshold: 150,
    amountToFreeShipping: 150,
  };

  return {
    cart,
    items,
    totals,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    error: cartQuery.error,
    refetch: cartQuery.refetch,
    addToCart: addToCartMutation.mutate,
    addToCartAsync: addToCartMutation.mutateAsync,
    isAddingToCart: addToCartMutation.isPending,
    updateQuantity: (itemId: string, quantity: number) =>
      updateQuantityMutation.mutate({ itemId, quantity }),
    isUpdatingQuantity: updateQuantityMutation.isPending,
    removeItem: removeItemMutation.mutate,
    isRemovingItem: removeItemMutation.isPending,
    clearCart: clearCartMutation.mutate,
    isClearingCart: clearCartMutation.isPending,
    applyCoupon: (code: string) => applyCouponMutation.mutate({ code }),
    isApplyingCoupon: applyCouponMutation.isPending,
    removeCoupon: removeCouponMutation.mutate,
    isRemovingCoupon: removeCouponMutation.isPending,
  };
}
