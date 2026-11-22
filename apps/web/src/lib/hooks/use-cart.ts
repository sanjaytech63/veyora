"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "../api/cart-api";
import { cartKeys } from "../api/query-keys";
import { CartDto, AddToCartPayload, ApplyCouponPayload } from "@veyora/types";
import { toast } from "sonner";

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
      toast.success("Garment added to bag", {
        description: "Your selection has been added to your shopping bag.",
      });
    },
    onError: (error: Error) => {
      toast.error("Could not add to bag", {
        description: error.message || "An unexpected issue occurred.",
      });
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
      toast.error("Could not update bag", {
        description: error.message || "An unexpected error occurred.",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => cartApi.removeCartItem(itemId),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.current(), updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      toast.success("Garment removed from bag");
    },
    onError: (error: Error) => {
      toast.error("Could not remove garment", {
        description: error.message || "Please try again.",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.current(), updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      toast.success("Shopping bag cleared");
    },
    onError: (error: Error) => {
      toast.error("Could not clear bag", {
        description: error.message || "Please try again.",
      });
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: (payload: ApplyCouponPayload) => cartApi.applyCoupon(payload),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.current(), updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      toast.success("Privilege code applied", {
        description: `${updatedCart.discountPercent}% discount activated on your order!`,
      });
    },
    onError: (error: Error) => {
      toast.error("Invalid coupon code", {
        description: error.message || "Please enter a valid promotional code.",
      });
    },
  });

  const removeCouponMutation = useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.current(), updatedCart);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      toast.success("Coupon removed");
    },
    onError: (error: Error) => {
      toast.error("Could not remove coupon", {
        description: error.message || "Please try again.",
      });
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
