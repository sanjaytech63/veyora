"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useCartStore } from "@/stores/cart-store";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { items, clearCart, getSubtotal } = useCartStore();
  const [mounted, setMounted] = React.useState(false);
  const [shippingMethod, setShippingMethod] = React.useState<"standard" | "express">("standard");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [orderComplete, setOrderComplete] = React.useState(false);
  const [orderId, setOrderId] = React.useState("");

  // Form State
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = mounted ? getSubtotal() : 0;
  const shippingFee = shippingMethod === "express" ? 25 : subtotal >= 150 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingFee + tax;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !address || !city || !postalCode) {
      toast.error("Required fields missing", { description: "Please complete all shipping address fields." });
      return;
    }

    setIsSubmitting(true);
    const generatedId = `VY-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderId(generatedId);
      setOrderComplete(true);
      clearCart();
      toast.success("Order Placed Successfully", {
        description: `Confirmation dispatched to ${email}`,
      });
    }, 1200);
  };

  if (!mounted) {
    return (
      <div className="py-16">
        <Container size="xl" className="space-y-6">
          <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-96 rounded-2xl bg-muted/40 animate-pulse" />
        </Container>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="py-20 md:py-28">
        <Container size="sm" className="space-y-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10 stroke-[2]" />
          </div>

          <div className="space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Order Confirmed // {orderId}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Thank You for Your Patronage
            </h1>
            <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
              We have dispatched your receipt and real-time shipment telemetry to{" "}
              <strong className="text-foreground">{email}</strong>. Our climate-controlled atelier has commenced preparation.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 text-left space-y-4 max-w-md mx-auto text-xs">
            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Courier Service</span>
              <span className="font-semibold text-foreground">
                {shippingMethod === "express" ? "Atelier Express Priority (1-2 Days)" : "Carbon-Neutral Ground (3-5 Days)"}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Delivery Destination</span>
              <span className="font-semibold text-foreground">{address}, {city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Settlement Total</span>
              <span className="font-bold text-foreground tabular-nums">${total.toFixed(2)}</span>
            </div>
          </div>

          <Button asChild size="lg" className="rounded-full px-8 text-xs font-semibold">
            <Link href="/shop">Return to Catalog</Link>
          </Button>
        </Container>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <Container size="sm" className="space-y-6">
          <h1 className="text-2xl font-bold">Your bag is empty</h1>
          <p className="text-xs text-muted-foreground">
            Please add items to your shopping bag before proceeding to checkout.
          </p>
          <Button asChild className="rounded-full px-6 text-xs font-semibold">
            <Link href="/shop">Explore Haute Couture</Link>
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 md:py-16 space-y-8">
      <Container size="xl" className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-5">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Shopping Bag</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-7 space-y-8">
              {/* Express checkout */}
              <div className="rounded-3xl border border-border/80 bg-muted/20 p-5 space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-center">
                  Instant Express Checkout
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-border bg-card font-semibold text-xs hover:bg-accent"
                    onClick={() => toast.info("Express payment connected")}
                  >
                    Apple Pay
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-border bg-card font-semibold text-xs hover:bg-accent"
                    onClick={() => toast.info("Express payment connected")}
                  >
                    Google Pay
                  </Button>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <span className="relative bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                  Or continue below
                </span>
              </div>

              {/* 1. Contact Information */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  1. Contact Information
                </h2>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="patron@atelier.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Order confirmation and courier telemetry will be dispatched to this address.
                  </p>
                </div>
              </div>

              {/* 2. Shipping Destination */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  2. Shipping Destination
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      required
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-xl text-xs h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs">
                    Street Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    required
                    placeholder="742 Evergreen Terrace, Suite 4B"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      required
                      placeholder="New York"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-xs">
                      State / Region
                    </Label>
                    <Input id="state" placeholder="NY" className="rounded-xl text-xs h-10" />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="postalCode" className="text-xs">
                      Postal Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="postalCode"
                      required
                      placeholder="10001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="rounded-xl text-xs h-10"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Delivery Method */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  3. Delivery Method
                </h2>
                <RadioGroup
                  value={shippingMethod}
                  onValueChange={(v) => setShippingMethod(v as "standard" | "express")}
                  className="space-y-2.5"
                >
                  <div className="flex items-center justify-between rounded-2xl border border-border/80 p-3.5 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="standard" id="shipping-standard" />
                      <Label htmlFor="shipping-standard" className="cursor-pointer text-xs space-y-0.5">
                        <div className="font-semibold text-foreground">Carbon-Neutral Ground Courier</div>
                        <div className="text-muted-foreground text-[11px]">3–5 business days with insured tracking</div>
                      </Label>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {subtotal >= 150 ? "Complimentary" : "$15.00"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-border/80 p-3.5 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="express" id="shipping-express" />
                      <Label htmlFor="shipping-express" className="cursor-pointer text-xs space-y-0.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>Atelier Priority Air Express</span>
                          <Sparkles className="h-3 w-3 text-amber-500" />
                        </div>
                        <div className="text-muted-foreground text-[11px]">1–2 business days prioritized handling</div>
                      </Label>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-foreground">$25.00</span>
                  </div>
                </RadioGroup>
              </div>

              {/* 4. Payment Settlement Preview */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    4. Payment Method
                  </h2>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Credit / Debit Card</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cardNumber" className="text-xs">
                      Card Number
                    </Label>
                    <Input
                      id="cardNumber"
                      placeholder="4000 1234 5678 9010"
                      defaultValue="•••• •••• •••• 4242"
                      className="rounded-xl text-xs h-10 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cardExpiry" className="text-xs">
                        Expiry Date
                      </Label>
                      <Input
                        id="cardExpiry"
                        placeholder="MM / YY"
                        defaultValue="12 / 28"
                        className="rounded-xl text-xs h-10 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cardCvc" className="text-xs">
                        CVC Security Code
                      </Label>
                      <Input
                        id="cardCvc"
                        placeholder="CVC"
                        defaultValue="888"
                        className="rounded-xl text-xs h-10 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 h-13"
              >
                {isSubmitting ? "Authorizing Atelier Settlement..." : `Place Order • $${total.toFixed(2)}`}
              </Button>
            </div>

            {/* Right Column: Order Line Items Sidebar */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    Order Items
                  </h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                    {items.length} items
                  </span>
                </div>

                {/* Line Items */}
                <div className="max-h-72 overflow-y-auto divide-y divide-border/60 pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                          {item.image ? (
                            <OptimizedImage
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover object-center"
                              sizes="56px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-muted-foreground">
                              VY
                            </div>
                          )}
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                            {item.quantity}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground line-clamp-1">
                            {item.title}
                          </p>
                          {(item.color || item.size) && (
                            <p className="text-[10px] text-muted-foreground">
                              {item.color} {item.size && `• ${item.size}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-xs font-bold text-foreground tabular-nums">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Calculation */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground font-semibold tabular-nums">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Courier Dispatch</span>
                    <span>{shippingFee === 0 ? "Complimentary" : `$${shippingFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Tax (8%)</span>
                    <span className="tabular-nums">${tax.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex items-baseline justify-between text-sm font-bold text-foreground">
                    <span>Due Today</span>
                    <span className="text-xl tabular-nums">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Backed by Veyora 100% Pure Fabric Quality Assurance</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
}
