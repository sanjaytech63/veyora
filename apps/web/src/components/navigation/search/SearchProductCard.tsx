"use client";

import * as React from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Package } from "lucide-react";
import { Product } from "@veyora/types";
import { cn } from "@/lib/utils";

interface SearchProductCardProps {
  product: Product;
  onSelect: (slug: string, title: string) => void;
  isActive?: boolean;
  className?: string;
}

export function SearchProductCard({
  product,
  onSelect,
  isActive = false,
  className,
}: SearchProductCardProps) {
  const primaryImage = product.images?.[0]?.url;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      onClick={() => onSelect(product.slug, product.title)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(product.slug, product.title);
        }
      }}
      className={cn(
        "group flex items-center gap-3.5 p-2.5 rounded-xl cursor-pointer hover:bg-accent/60 transition-colors border border-transparent",
        isActive && "bg-accent/70 border-primary/30",
        className
      )}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted/40 border border-border/40">
        {primaryImage ? (
          <OptimizedImage
            src={primaryImage}
            alt={product.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
          {product.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {product.category?.name ? (
            <span className="truncate">{product.category.name}</span>
          ) : (
            <span className="truncate line-clamp-1">
              {product.description || "Haute Couture Garment"}
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-foreground tabular-nums">
          ${product.price.toFixed(2)}
        </div>
        {hasDiscount && (
          <div className="text-[11px] text-muted-foreground line-through tabular-nums">
            ${product.compareAtPrice?.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}
