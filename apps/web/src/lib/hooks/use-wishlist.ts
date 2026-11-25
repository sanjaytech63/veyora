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
    onMutate: async (productId: string) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.current() });
      const previousWishlist = queryClient.getQueryData<WishlistDto>(wishlistKeys.current());

      if (previousWishlist) {
        queryClient.setQueryData<WishlistDto>(wishlistKeys.current(), {
          ...previousWishlist,
          items: [
            ...previousWishlist.items,
            {
              id: productId,
              productId,
              title: "Garment Selection",
              slug: productId,
              price: 0,
              stock: 1,
              isAvailable: true,
              addedAt: new Date().toISOString(),
            },
          ],
          itemCount: previousWishlist.items.length + 1,
        });
      }

      return { previousWishlist };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(wishlistKeys.current(), context.previousWishlist);
      }
      toast.error("Could not save to wishlist", {
        description: error.message || "Please try again.",
      });
    },
    onSuccess: (updatedWishlist) => {
      queryClient.setQueryData(wishlistKeys.current(), updatedWishlist);
      toast.success("Saved to Personal Collection", {
        description: "Garment saved to your personal atelier wishlist.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.current() });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.removeFromWishlist(productId),
    onMutate: async (productId: string) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.current() });
      const previousWishlist = queryClient.getQueryData<WishlistDto>(wishlistKeys.current());

      if (previousWishlist) {
        queryClient.setQueryData<WishlistDto>(wishlistKeys.current(), {
          ...previousWishlist,
          items: previousWishlist.items.filter(
            (i) => i.productId !== productId && i.id !== productId
          ),
          itemCount: Math.max(0, previousWishlist.items.length - 1),
        });
      }

      return { previousWishlist };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(wishlistKeys.current(), context.previousWishlist);
      }
      toast.error("Could not remove from wishlist", {
        description: error.message || "Please try again.",
      });
    },
    onSuccess: (updatedWishlist) => {
      queryClient.setQueryData(wishlistKeys.current(), updatedWishlist);
      toast.success("Removed from wishlist");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.current() });
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
