"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "../api/wishlist-api";
import { wishlistKeys } from "../api/query-keys";
import { WishlistDto } from "@veyora/types";
import { toast } from "sonner";

export function useWishlist() {
  const queryClient = useQueryClient();

  const wishlistQuery = useQuery<WishlistDto>({
    queryKey: wishlistKeys.current(),
    queryFn: () => wishlistApi.getWishlist(),
    staleTime: 1000 * 60, // 1 minute
  });

  const addToWishlistMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.addToWishlist({ productId }),
    onSuccess: (updatedWishlist) => {
      queryClient.setQueryData(wishlistKeys.current(), updatedWishlist);
      queryClient.invalidateQueries({ queryKey: wishlistKeys.current() });
      toast.success("Saved to Personal Collection", {
        description: "Garment saved to your personal atelier wishlist.",
      });
    },
    onError: (error: Error) => {
      toast.error("Could not save to wishlist", {
        description: error.message || "Please try again.",
      });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.removeFromWishlist(productId),
    onSuccess: (updatedWishlist) => {
      queryClient.setQueryData(wishlistKeys.current(), updatedWishlist);
      queryClient.invalidateQueries({ queryKey: wishlistKeys.current() });
      toast.success("Removed from wishlist");
    },
    onError: (error: Error) => {
      toast.error("Could not remove from wishlist", {
        description: error.message || "Please try again.",
      });
    },
  });

  const clearWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.clearWishlist(),
    onSuccess: (updatedWishlist) => {
      queryClient.setQueryData(wishlistKeys.current(), updatedWishlist);
      queryClient.invalidateQueries({ queryKey: wishlistKeys.current() });
      toast.success("Wishlist cleared");
    },
    onError: (error: Error) => {
      toast.error("Could not clear wishlist", {
        description: error.message || "Please try again.",
      });
    },
  });

  const wishlist = wishlistQuery.data;
  const items = wishlist?.items || [];
  const itemCount = items.length;

  const isInWishlist = (productId: string) => {
    return items.some((i) => i.productId === productId || i.id === productId);
  };

  const toggleWishlist = (productId: string) => {
    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  return {
    wishlist,
    items,
    itemCount,
    isLoading: wishlistQuery.isLoading,
    isError: wishlistQuery.isError,
    error: wishlistQuery.error,
    refetch: wishlistQuery.refetch,
    isInWishlist,
    toggleWishlist,
    addToWishlist: addToWishlistMutation.mutate,
    isAddingToWishlist: addToWishlistMutation.isPending,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    removeItem: removeFromWishlistMutation.mutate,
    isRemovingFromWishlist: removeFromWishlistMutation.isPending,
    clearWishlist: clearWishlistMutation.mutate,
    isClearingWishlist: clearWishlistMutation.isPending,
  };
}
