"use client";

import * as React from "react";
import Link from "next/link";
import { Product } from "@veyora/types";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { StockBadge } from "./stock-badge";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Heart, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
  priority = false,
}: ProductCardProps) {
  const defaultImage = product.images?.[0]?.url || "";
  const [activeImage, setActiveImage] = React.useState<string>(defaultImage);
  const [activeColor, setActiveColor] = React.useState<string | null>(null);

  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const isFavorited = isInWishlist(product.id);

  React.useEffect(() => {
    setActiveImage(product.images?.[0]?.url || "");
  }, [product.images]);

  const isDiscounted = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = isDiscounted
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  // Extract distinct colors
  const colorVariants = React.useMemo(() => {
    if (!product.variants) return [];
    const colors: { name: string; image?: string }[] = [];
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

  // Extract distinct sizes
  const sizes = React.useMemo(() => {
    if (!product.variants) return [];
    const s: string[] = [];
    product.variants.forEach((v) => {
      if (v.size && !s.includes(v.size)) {
        s.push(v.size);
      }
    });
    return s;
  }, [product.variants]);

  const getSwatchClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("red") || n.includes("crimson") || n.includes("ruby") || n.includes("maroon") || n.includes("vermilion"))
      return "bg-red-700";
    if (n.includes("green") || n.includes("emerald") || n.includes("sage") || n.includes("olive"))
      return "bg-emerald-800";
    if (n.includes("gold") || n.includes("mustard") || n.includes("amber") || n.includes("yellow") || n.includes("turmeric"))
      return "bg-amber-500";
    if (n.includes("blue") || n.includes("indigo") || n.includes("royal") || n.includes("navy"))
      return "bg-indigo-900";
    if (n.includes("pink") || n.includes("rose") || n.includes("blush") || n.includes("magenta"))
      return "bg-pink-600";
    if (n.includes("ivory") || n.includes("pearl") || n.includes("champagne") || n.includes("cream") || n.includes("ecru"))
      return "bg-amber-100 border border-border";
    if (n.includes("rust") || n.includes("terracotta") || n.includes("copper") || n.includes("orange"))
      return "bg-orange-700";
    if (n.includes("black") || n.includes("midnight") || n.includes("noir"))
      return "bg-zinc-950";
    return "bg-primary";
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: product.images?.[0]?.url,
      category: categoryName,
      stock: product.stock,
    });
    if (isFavorited) {
      toast.info("Removed from Wishlist", { description: product.title });
    } else {
      toast.success("Saved to Wishlist", { description: product.title });
    }
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[24px] border border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {/* Fashion Gallery Media Stage */}
      <div className="relative p-2 pb-0">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-[4/5.2] w-full overflow-hidden rounded-[18px] bg-muted/50 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]"
        >
          {activeImage ? (
            <OptimizedImage
              src={activeImage}
              alt={product.title}
              fill
              priority={priority}
              className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/30 p-6 text-center">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {product.title}
              </span>
            </div>
          )}

          {/* Subtle Top Vignette for Badges */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 to-transparent opacity-60" />

          {/* Badges */}
          <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
            {product.tags?.includes("festive") || product.tags?.includes("featured") ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-zinc-950/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                Festive Edit
              </span>
            ) : null}
            {isDiscounted && (
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-950 shadow-xs backdrop-blur-md tabular-nums">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Wishlist Heart Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleToggleWishlist}
            aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
            className={cn(
              "absolute right-3 top-3 z-10 h-8 w-8 rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/60",
              isFavorited && "border-red-500/50 bg-red-500/20 text-red-500"
            )}
          >
            <Heart
              className={cn("h-4 w-4 transition-colors", isFavorited && "fill-current text-red-500")}
            />
          </Button>

          {/* Quick View Floating Pill (Hover on Desktop) */}
          <div className="absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 sm:block">
            <div className="flex items-center justify-between rounded-xl border border-white/20 bg-zinc-950/80 px-3.5 py-2.5 text-xs font-medium text-white shadow-xl backdrop-blur-xl">
              <span>View Garment Details</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Category & Rating */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground truncate max-w-[150px]">
            {categoryName || "Handcrafted Couture"}
          </span>
          <div className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-foreground/80 tabular-nums shrink-0">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span>4.9</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2 text-[14px] sm:text-[15px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-1">
          <Link href={`/products/${product.slug}`}>{product.title}</Link>
        </h3>

        {/* Sizes Preview or Color Swatches */}
        <div className="mt-2.5 flex min-h-[22px] items-center justify-between">
          {colorVariants.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {colorVariants.slice(0, 4).map((c) => {
                  const isSelected = activeColor === c.name;
                  return (
                    <Button
                      key={c.name}
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Color: ${c.name}`}
                      title={c.name}
                      onMouseEnter={() => {
                        setActiveColor(c.name);
                        if (c.image) setActiveImage(c.image);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveColor(c.name);
                        if (c.image) setActiveImage(c.image);
                      }}
                      className={cn(
                        "relative h-3.5 w-3.5 rounded-full p-0 transition-all duration-200 focus:outline-none",
                        getSwatchClass(c.name),
                        isSelected
                          ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card"
                          : "ring-1 ring-black/15 hover:scale-110 dark:ring-white/20"
                      )}
                    />
                  );
                })}
              </div>
              {activeColor && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">
                  {activeColor}
                </span>
              )}
            </div>
          ) : sizes.length > 0 ? (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <span>Sizes:</span>
              <span className="font-semibold text-foreground/90">{sizes.join(" • ")}</span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground/70">Handcrafted Pure Silk</span>
          )}
        </div>

        {/* Pricing & Stock Telemetry */}
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3.5">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-base font-bold tracking-tight text-foreground">
              ${product.price.toFixed(2)}
            </span>
            {isDiscounted && (
              <span className="text-xs font-normal text-muted-foreground line-through">
                ${product.compareAtPrice!.toFixed(2)}
              </span>
            )}
          </div>

          <StockBadge
            stock={product.stock}
            trackQuantity={product.trackQuantity}
            showTextDetail={false}
          />
        </div>
      </div>
    </article>
  );
}
