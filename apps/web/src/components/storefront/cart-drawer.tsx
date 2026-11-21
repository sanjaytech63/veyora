"use client";

import * as React from "react";
import Link from "next/link";
import { useUIStore } from "@/stores/ui-store";
import { useCart } from "@/lib/hooks/use-cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Separator } from "@/components/ui/separator";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export function CartDrawer() {
  const { cartDrawerOpen, setCartDrawerOpen } = useUIStore();
  const {
    items,
    totals,
    isLoading,
    updateQuantity,
    removeItem,
    isUpdatingQuantity,
    isRemovingItem,
  } = useCart();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalCount = mounted ? totals.itemCount : 0;
  const subtotal = mounted ? totals.subtotal : 0;
  const amountToFreeShipping = mounted ? totals.amountToFreeShipping : 150;
  const freeShippingThreshold = totals.freeShippingThreshold || 150;
  const freeShippingProgress = Math.min(
    100,
    ((freeShippingThreshold - amountToFreeShipping) / freeShippingThreshold) * 100
  );

  const handleClose = () => setCartDrawerOpen(false);

  return (
    <Sheet open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md bg-card/95 backdrop-blur-xl border-l border-border/80"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2.5 text-base font-bold tracking-tight">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span>Shopping Bag</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                {totalCount}
              </span>
            </SheetTitle>
          </div>

          {/* Dynamic Free Shipping Threshold Progress */}
          <div className="pt-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Sparkles className="h-3 w-3 text-amber-500" />
                {amountToFreeShipping > 0 ? (
                  <>
                    Add <strong className="text-foreground">${amountToFreeShipping.toFixed(2)}</strong> for free express shipping
                  </>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    You have unlocked Complimentary Express Shipping!
                  </span>
                )}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {Math.round(freeShippingProgress)}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        </SheetHeader>

        {/* Body Content */}
        {!mounted || isLoading ? (
          <div className="flex-1 px-6 py-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-20 w-20 rounded-xl bg-muted/60 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 rounded bg-muted/60" />
                  <div className="h-3 w-1/2 rounded bg-muted/40" />
                  <div className="h-4 w-1/4 rounded bg-muted/50" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-muted/40 text-muted-foreground mb-4">
              <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold tracking-tight text-foreground">
              Your bag is currently empty
            </h3>
            <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
              Explore our handcrafted Indian silks, embroidered bridal ensembles, and contemporary luxury kurtis.
            </p>
            <Button
              asChild
              onClick={handleClose}
              className="mt-6 rounded-full px-6 text-xs font-semibold"
            >
              <Link href="/shop">Discover Garments</Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border/60">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 py-4 group">
                {/* Thumbnail */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                  {item.image ? (
                    <OptimizedImage
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover object-center"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground font-mono">
                      VY
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={handleClose}
                        className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={isRemovingItem}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-transparent -mr-1"
                        aria-label={`Remove ${item.title} from bag`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {(item.color || item.size) && (
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {item.color && <span>Color: {item.color}</span>}
                        {item.color && item.size && <span>•</span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </div>
                    )}

                    {!item.isAvailable && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                        <AlertCircle className="h-3 w-3" />
                        <span>Unavailable or out of stock</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Stepper */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-lg border border-border/80 bg-background p-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md p-0"
                        disabled={isUpdatingQuantity}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-7 text-center text-xs font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md p-0"
                        disabled={isUpdatingQuantity || (item.maxStock !== undefined && item.quantity >= item.maxStock)}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-right tabular-nums">
                      <div className="text-xs font-bold text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-[10px] text-muted-foreground">
                          ${item.price.toFixed(2)} each
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Summary */}
        {mounted && items.length > 0 && (
          <div className="border-t border-border/60 bg-muted/20 px-6 py-5 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-medium text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground font-semibold tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Privilege Discount</span>
                  <span className="tabular-nums">-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>
                  {totals.shipping === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Free Express</span>
                  ) : (
                    `$${totals.shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Tax (8%)</span>
                <span className="tabular-nums">${totals.estimatedTax.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm font-bold text-foreground">
              <span>Estimated Total</span>
              <span className="text-base tabular-nums">${totals.total.toFixed(2)}</span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                asChild
                size="lg"
                onClick={handleClose}
                className="w-full rounded-full font-semibold text-xs shadow-md shadow-primary/10 h-11"
              >
                <Link href="/checkout" className="inline-flex items-center justify-center gap-2">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="w-full rounded-full text-xs font-medium border-border/80"
              >
                <Link href="/cart">View Full Bag</Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Guaranteed Safe &amp; Secure Checkout</span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
