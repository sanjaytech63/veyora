"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "ghost" | "outline" | "secondary";
  showLabel?: boolean;
}

export function WishlistButton({
  productId,
  className,
  size = "icon",
  variant = "ghost",
  showLabel = false,
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();
  const active = isInWishlist(productId);
  const isPending = isAddingToWishlist || isRemovingFromWishlist;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={isPending}
      onClick={handleClick}
      aria-label={active ? "Remove from personal collection" : "Save to personal collection"}
      className={cn(
        "transition-all duration-200",
        active && "text-rose-500 hover:text-rose-600",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-transform duration-200",
          active ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground",
          isPending && "animate-pulse"
        )}
      />
      {showLabel && (
        <span className="ml-2 text-xs font-medium">
          {active ? "In Personal Collection" : "Save to Wishlist"}
        </span>
      )}
    </Button>
  );
}
