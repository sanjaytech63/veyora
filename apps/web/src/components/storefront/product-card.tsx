"use client";

import * as React from "react";
import Link from "next/link";
import { Product } from "@veyora/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { StockBadge } from "./stock-badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Sparkles, Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  className?: string;
  priority?: boolean;
}

export function ProductCard({
  product,
  categoryName,
  className,
}: ProductCardProps) {
  const [activeImage, setActiveImage] = React.useState<string>(
    product.images?.[0]?.url || ""
  );

  const isDiscounted =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = isDiscounted
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100
      )
    : 0;

  const colorVariants = React.useMemo(() => {
    if (!product.variants) return [];
    const colors: { name: string; image?: string; colorCode?: string }[] = [];
    product.variants.forEach((v) => {
      if (v.color && !colors.some((c) => c.name === v.color)) {
        colors.push({
          name: v.color,
          image: v.image,
        });
      }
    });
    return colors;
  }, [product.variants]);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-500 hover:border-border hover:shadow-xl hover:shadow-primary/5",
        className
      )}
    >
      {/* Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-muted/40"
      >
        {activeImage ? (
          <OptimizedImage
            src={activeImage}
            alt={product.title}
            fill
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-muted/80 to-muted/30 p-6 text-center">
            <span className="text-xs font-medium text-muted-foreground">
              {product.title}
            </span>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
          {product.tags?.includes("featured") && (
            <Badge
              variant="default"
              className="bg-primary/95 text-primary-foreground backdrop-blur-md shadow-xs text-[11px] font-semibold px-2 py-0.5"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Featured
            </Badge>
          )}
          {isDiscounted && (
            <Badge
              variant="destructive"
              className="text-[11px] font-semibold tracking-tight shadow-xs px-2 py-0.5"
            >
              Save {discountPercent}%
            </Badge>
          )}
        </div>

        {/* Hover Quick Action */}
        <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 hidden sm:block">
          <div className="flex items-center justify-between rounded-xl bg-background/90 px-3.5 py-2.5 backdrop-blur-md border border-border/60 shadow-lg text-xs font-semibold text-foreground">
            <span>Explore Details</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Category or Brand */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{categoryName || "Curated Edition"}</span>
          <div className="flex items-center gap-1 text-foreground/80">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-xs">4.9</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-1.5 font-medium text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors text-sm sm:text-base">
          <Link href={`/products/${product.slug}`}>{product.title}</Link>
        </h3>

        {/* Color Swatch Previews */}
        {colorVariants.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5">
            {colorVariants.slice(0, 4).map((c) => (
              <Button
                key={c.name}
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Preview ${c.name}`}
                title={c.name}
                onMouseEnter={() => {
                  if (c.image) setActiveImage(c.image);
                }}
                className={cn(
                  "h-4 w-4 p-0 rounded-full border border-background ring-1 ring-border/80 transition-transform hover:scale-125",
                  c.name.toLowerCase().includes("black") || c.name.toLowerCase().includes("obsidian")
                    ? "bg-zinc-900 hover:bg-zinc-900"
                    : c.name.toLowerCase().includes("silver") || c.name.toLowerCase().includes("frost")
                    ? "bg-zinc-300 hover:bg-zinc-300"
                    : c.name.toLowerCase().includes("sand") || c.name.toLowerCase().includes("cognac")
                    ? "bg-amber-700 hover:bg-amber-700"
                    : c.name.toLowerCase().includes("white") || c.name.toLowerCase().includes("chalk")
                    ? "bg-zinc-100 hover:bg-zinc-100"
                    : "bg-primary hover:bg-primary"
                )}
              />
            ))}
            {colorVariants.length > 4 && (
              <span className="text-[10px] text-muted-foreground ml-0.5">
                +{colorVariants.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Price & Stock Footer */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/40">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              ${product.price.toFixed(2)}
            </span>
            {isDiscounted && (
              <span className="text-xs text-muted-foreground line-through">
                ${product.compareAtPrice!.toFixed(2)}
              </span>
            )}
          </div>

          <StockBadge stock={product.stock} trackQuantity={product.trackQuantity} showTextDetail={false} />
        </div>
      </div>
    </div>
  );
}
