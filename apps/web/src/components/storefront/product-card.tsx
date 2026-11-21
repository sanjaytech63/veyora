"use client";

import * as React from "react";
import Link from "next/link";
import { Product } from "@veyora/types";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { StockBadge } from "./stock-badge";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Heart, Star } from "lucide-react";
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

  const getSwatchClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("black") || n.includes("obsidian") || n.includes("carbon")) return "bg-zinc-900";
    if (n.includes("silver") || n.includes("frost") || n.includes("titanium")) return "bg-zinc-300";
    if (n.includes("sand") || n.includes("cognac") || n.includes("amber")) return "bg-amber-700";
    if (n.includes("white") || n.includes("chalk") || n.includes("alabaster"))
      return "bg-stone-100";
    if (n.includes("navy") || n.includes("cobalt")) return "bg-slate-800";
    if (n.includes("sage") || n.includes("olive")) return "bg-emerald-800";
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
        "group relative flex flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {/* Gallery Media Stage */}
      <div className="relative p-2 pb-0">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-[4/4.6] w-full overflow-hidden rounded-[16px] bg-muted/50 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]"
        >
          {activeImage ? (
            <OptimizedImage
              src={activeImage}
              alt={product.title}
              fill
              priority={priority}
              className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/30 p-6 text-center">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {product.title}
              </span>
            </div>
          )}

          {/* Subtle Top Vignette for Badge Legibility */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 to-transparent opacity-60" />

          {/* Floating Glassmorphic Badges */}
          <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
            {product.tags?.includes("featured") && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-zinc-950/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Atelier Pick
              </span>
            )}
            {isDiscounted && (
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-950 shadow-xs backdrop-blur-md tabular-nums">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Wishlist Heart Action (Mobile + Desktop) */}
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

          {/* Floating Action Pill */}
          <div className="absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 sm:block">
            <div className="flex items-center justify-between rounded-xl border border-white/20 bg-zinc-950/80 px-3.5 py-2.5 text-xs font-medium text-white shadow-xl backdrop-blur-xl">
              <span>Inspect Hardware</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Product Telemetry & Details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Top Metadata Row */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {categoryName || "Series 01"}
          </span>
          <div className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-foreground/80 tabular-nums">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span>4.9</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-1">
          <Link href={`/products/${product.slug}`}>{product.title}</Link>
        </h3>

        {/* Interactive Finish Swatches */}
        <div className="mt-3 flex min-h-[22px] items-center justify-between">
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
                      aria-label={`Finish: ${c.name}`}
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
              {!activeColor && colorVariants.length > 4 && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  +{colorVariants.length - 4}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground/70">Anodized Standard Finish</span>
          )}
        </div>

        {/* Footer: Tabular Pricing & Stock Telemetry */}
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
