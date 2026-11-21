"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

const FREE_SHIPPING_THRESHOLD = 150;

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getItemCount } =
    useCartStore();
  const [mounted, setMounted] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState("");
  const [appliedPromo, setAppliedPromo] = React.useState<{ code: string; percent: number } | null>(
    null
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalCount = mounted ? getItemCount() : 0;
  const subtotal = mounted ? getSubtotal() : 0;
  const discountAmount = appliedPromo ? (subtotal * appliedPromo.percent) / 100 : 0;
  const discountedSubtotal = subtotal - discountAmount;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - discountedSubtotal);
  const shippingFee = discountedSubtotal >= FREE_SHIPPING_THRESHOLD || discountedSubtotal === 0 ? 0 : 15;
  const estimatedTax = discountedSubtotal * 0.08; // 8% estimated tax
  const orderTotal = discountedSubtotal + shippingFee + estimatedTax;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === "ATELIER10" || clean === "VEYORA10") {
      setAppliedPromo({ code: clean, percent: 10 });
      toast.success("Promo code applied", { description: "10% privilege discount unlocked!" });
    } else {
      toast.error("Invalid coupon code", { description: "Try code ATELIER10 for 10% off" });
    }
  };

  if (!mounted) {
    return (
      <div className="py-16">
        <Container size="xl" className="space-y-6">
          <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 h-96 rounded-2xl bg-muted/40 animate-pulse" />
            <div className="lg:col-span-4 h-80 rounded-2xl bg-muted/40 animate-pulse" />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16 space-y-10">
      <Container size="xl" className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
              <span>Review Order</span>
            </div>
            <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Shopping Bag
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalCount === 1 ? "1 item in your bag" : `${totalCount} items in your bag`}
            </p>
          </div>

          {items.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="text-xs text-muted-foreground hover:text-destructive rounded-full"
            >
              Clear Bag
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-16 rounded-3xl border border-dashed border-border/80 bg-muted/20">
            <EmptyState
              icon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
              title="Your bag is empty"
              description="You have not added any apparel or accessories to your shopping bag yet."
              action={
                <Button asChild className="rounded-full px-6 text-xs font-semibold">
                  <Link href="/shop" className="inline-flex items-center gap-2">
                    <span>Discover Products</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Items List */}
            <div className="lg:col-span-8 space-y-6">
              {/* Shipping progress banner */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {amountToFreeShipping > 0 ? (
                      <>
                        Add <strong className="text-foreground">${amountToFreeShipping.toFixed(2)}</strong> more for free express shipping
                      </>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Complimentary Worldwide Express Dispatch Unlocked!
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {Math.min(100, Math.round((discountedSubtotal / FREE_SHIPPING_THRESHOLD) * 100))}%
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (discountedSubtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="rounded-3xl border border-border/60 bg-card overflow-hidden divide-y divide-border/60">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6"
                  >
                    {/* Media & Meta */}
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted/40">
                        {item.image ? (
                          <OptimizedImage
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover object-center"
                            sizes="80px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-mono text-xs text-muted-foreground">
                            VY
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Link
                          href={`/products/${item.slug}`}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        {(item.color || item.size) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.color && <span>Color: {item.color}</span>}
                            {item.color && item.size && <span>•</span>}
                            {item.size && <span>Size: {item.size}</span>}
                          </div>
                        )}
                        <div className="text-xs font-mono text-muted-foreground/80">
                          SKU: {item.sku || "VY-STD-01"}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper & Price */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:gap-8 pt-3 sm:pt-0 border-t sm:border-0 border-border/40">
                      {/* Stepper */}
                      <div className="flex items-center rounded-xl border border-border/80 bg-muted/30 p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg p-0"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-xs font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg p-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right tabular-nums">
                        <div className="text-sm font-bold text-foreground">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[11px] text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </div>
                        )}
                      </div>

                      {/* Delete */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-transparent"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2">
                <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                  <Link href="/shop">← Continue Shopping</Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-md shadow-black/[0.02] space-y-5">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Order Summary
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground font-semibold tabular-nums">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Privilege Code ({appliedPromo.code})</span>
                      <span className="tabular-nums">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Shipping</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Free
                        </span>
                      ) : (
                        `$${shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Tax (8%)</span>
                    <span className="tabular-nums">${estimatedTax.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex items-baseline justify-between text-base font-bold text-foreground">
                    <span>Total</span>
                    <span className="text-xl tabular-nums">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} className="flex gap-2 pt-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Promo Code (ATELIER10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="pl-8 text-xs rounded-xl h-9"
                    />
                  </div>
                  <Button type="submit" variant="outline" size="sm" className="rounded-xl text-xs h-9 px-3">
                    Apply
                  </Button>
                </form>

                {/* Checkout CTA */}
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-2xl font-semibold text-xs shadow-md shadow-primary/15 h-12"
                >
                  <Link href="/checkout" className="inline-flex items-center justify-center gap-2">
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                {/* Trust Highlights */}
                <div className="space-y-2 pt-2 text-[11px] text-muted-foreground border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>256-bit Bank Grade Encrypted Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>30-Day Hassle-Free Global Return Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>100% Carbon-Neutral Insured Courier Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
