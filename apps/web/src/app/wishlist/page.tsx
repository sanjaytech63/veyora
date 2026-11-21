"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { EmptyState } from "@/components/ui/empty-state";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { setCartDrawerOpen } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleMoveToBag = (item: (typeof items)[0]) => {
    addItem({
      id: `${item.id}-default`,
      productId: item.id,
      slug: item.slug,
      title: item.title,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      image: item.image,
      maxStock: item.stock ?? 99,
    });
    removeItem(item.id);
    toast.success("Moved to Bag", { description: item.title });
    setCartDrawerOpen(true);
  };

  if (!mounted) {
    return (
      <div className="py-16">
        <Container size="xl" className="space-y-6">
          <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16 space-y-10">
      <Container size="xl" className="space-y-8">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Heart className="h-3.5 w-3.5 text-primary" />
              <span>Personal Collection</span>
            </div>
            <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              My Saved Atelier Pieces
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length === 1
                ? "1 curated piece saved"
                : `${items.length} curated pieces saved to your local session`}
            </p>
          </div>

          {items.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearWishlist}
              className="text-xs text-muted-foreground hover:text-destructive rounded-full"
            >
              Clear Entire Wishlist
            </Button>
          )}
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="py-16 rounded-3xl border border-dashed border-border/80 bg-muted/20">
            <EmptyState
              icon={<Heart className="h-8 w-8 text-muted-foreground" />}
              title="Your wishlist is empty"
              description="Explore the Veyora catalog and tap the heart icon on any design to curate your personal collection."
              action={
                <Button asChild className="rounded-full px-6 text-xs font-semibold">
                  <Link href="/shop" className="inline-flex items-center gap-2">
                    <span>Explore Catalog</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-foreground/20"
              >
                {/* Media Stage */}
                <div className="relative p-2 pb-0">
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative block aspect-[4/4.6] w-full overflow-hidden rounded-[16px] bg-muted/50"
                  >
                    {item.image ? (
                      <OptimizedImage
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono text-xs text-muted-foreground">
                        VY
                      </div>
                    )}
                  </Link>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-destructive hover:text-white transition-all"
                    aria-label={`Remove ${item.title} from wishlist`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Info & Action */}
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div className="space-y-1">
                    {item.category && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.category}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold tracking-tight text-foreground line-clamp-1">
                      <Link href={`/products/${item.slug}`} className="hover:text-primary">
                        {item.title}
                      </Link>
                    </h3>
                    <div className="flex items-baseline gap-2 pt-1 tabular-nums">
                      <span className="text-sm font-bold text-foreground">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          ${item.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 mt-4">
                    <Button
                      size="sm"
                      className="w-full rounded-xl text-xs font-semibold gap-1.5 h-9"
                      onClick={() => handleMoveToBag(item)}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Move to Bag
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
