/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useCart } from "@/lib/hooks/use-cart";
import { useAddresses } from "@/lib/hooks/use-addresses";
import { useCheckout } from "@/lib/hooks/use-checkout";
import { usePayment } from "@/lib/hooks/use-payment";
import { useAuthStore } from "@/stores/auth-store";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Truck,
  MapPin,
  Plus,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { notifyApiError, notifyApiSuccess, notifyWarning } from "@/lib/notifications";
import {
  AddressDto,
  CreateAddressPayload,
  OrderDto,
  PaymentOrderInitDto,
  PaymentVerificationResultDto,
} from "@veyora/types";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { items: cartItems, totals: cartTotals, clearCart } = useCart();
  const [shippingMethod, setShippingMethod] = React.useState<"standard" | "express">("standard");

  const {
    validation,
    isValid: isCheckoutValid,
    warnings,
    shippingOptions,
    totals: serverTotals,
    placeOrderAsync,
    isPlacingOrder,
  } = useCheckout(shippingMethod);

  const { initiatePaymentAsync, verifyPaymentAsync } = usePayment();

  const { addresses, createAddressAsync } = useAddresses();

  const [mounted, setMounted] = React.useState(false);
  const [completedOrder, setCompletedOrder] = React.useState<OrderDto | null>(null);
  const [pendingPaymentOrder, setPendingPaymentOrder] = React.useState<OrderDto | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [simulatedModalOpen, setSimulatedModalOpen] = React.useState(false);
  const [currentInitDto, setCurrentInitDto] = React.useState<PaymentOrderInitDto | null>(null);
  const [verifiedPayment, setVerifiedPayment] = React.useState<PaymentVerificationResultDto | null>(
    null
  );

  // Idempotency token per checkout session
  const [idempotencyKey, setIdempotencyKey] = React.useState<string>("");

  // Address selection mode: "saved" (using a saved address id) or "new"
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>("new");

  // Contact State
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  // Shipping Destination Form
  const [street, setStreet] = React.useState("");
  const [apartment, setApartment] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [country, setCountry] = React.useState("India");
  const [saveToAddresses, setSaveToAddresses] = React.useState(false);

  // Billing address state
  const [sameAsShipping, setSameAsShipping] = React.useState(true);
  const [billingFirstName, setBillingFirstName] = React.useState("");
  const [billingLastName, setBillingLastName] = React.useState("");
  const [billingStreet, setBillingStreet] = React.useState("");
  const [billingCity, setBillingCity] = React.useState("");
  const [billingState, setBillingState] = React.useState("");
  const [billingPostalCode, setBillingPostalCode] = React.useState("");
  const [billingCountry] = React.useState("India");

  const [customerNote, setCustomerNote] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
    // Initialize idempotency key
    if (typeof window !== "undefined") {
      setIdempotencyKey(crypto.randomUUID());
    }
  }, []);

  // Pre-fill user profile if available
  React.useEffect(() => {
    if (user) {
      if (!email && user.email) setEmail(user.email);
      if (!firstName && user.firstName) setFirstName(user.firstName);
      if (!lastName && user.lastName) setLastName(user.lastName);
    }
  }, [user, email, firstName, lastName]);

  // If saved addresses load and user hasn't chosen one, pick default
  React.useEffect(() => {
    if (addresses.length > 0 && selectedAddressId === "new") {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }, [addresses, selectedAddressId]);

  // Verified totals from server or fallback to client totals
  const activeTotals = serverTotals || cartTotals;
  const subtotal = activeTotals.subtotal;
  const discount = activeTotals.discount;
  const shippingFee = activeTotals.shipping;
  const tax = activeTotals.estimatedTax;
  const total = activeTotals.total;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      notifyWarning("Contact details required", "Please provide a valid patron email address.");
      return;
    }

    let resolvedShippingAddress: CreateAddressPayload;

    if (selectedAddressId !== "new") {
      const saved = addresses.find((a) => a.id === selectedAddressId);
      if (!saved) {
        notifyWarning("Selected address not found", "Please pick or enter a delivery address.");
        return;
      }
      resolvedShippingAddress = {
        firstName: saved.firstName,
        lastName: saved.lastName,
        street: saved.street,
        apartment: saved.apartment,
        city: saved.city,
        state: saved.state,
        postalCode: saved.postalCode,
        country: saved.country,
        phone: saved.phone || phone,
      };
    } else {
      if (!firstName || !street || !city || !state || !postalCode) {
        notifyWarning(
          "Incomplete delivery destination",
          "First name, street, city, state and postal code are strictly required."
        );
        return;
      }
      resolvedShippingAddress = {
        firstName,
        lastName: lastName || firstName,
        street,
        apartment,
        city,
        state,
        postalCode,
        country,
        phone,
      };

      // If user wants to save address
      if (saveToAddresses && isAuthenticated) {
        try {
          await createAddressAsync({
            ...resolvedShippingAddress,
            isDefault: addresses.length === 0,
          });
        } catch {
          // Non-blocking for order completion
        }
      }
    }

    let resolvedBillingAddress: CreateAddressPayload | undefined;
    if (!sameAsShipping) {
      if (
        !billingFirstName ||
        !billingStreet ||
        !billingCity ||
        !billingState ||
        !billingPostalCode
      ) {
        notifyWarning(
          "Incomplete billing address",
          "Please complete all required billing address fields."
        );
        return;
      }
      resolvedBillingAddress = {
        firstName: billingFirstName,
        lastName: billingLastName || billingFirstName,
        street: billingStreet,
        city: billingCity,
        state: billingState,
        postalCode: billingPostalCode,
        country: billingCountry,
      };
    }

    try {
      const order = await placeOrderAsync({
        customerEmail: email,
        customerName:
          `${resolvedShippingAddress.firstName} ${resolvedShippingAddress.lastName}`.trim(),
        shippingAddress: resolvedShippingAddress,
        billingAddress: resolvedBillingAddress,
        sameAsShipping,
        shippingMethod,
        customerNote: customerNote || undefined,
        idempotencyKey: idempotencyKey || crypto.randomUUID(),
      });

      setPendingPaymentOrder(order);
      await launchPayment(order);
    } catch (err: unknown) {
      notifyApiError(err);
    }
  };

  const launchPayment = async (order: OrderDto) => {
    try {
      setIsProcessingPayment(true);
      const initDto = await initiatePaymentAsync({
        orderId: order.id,
        provider: "razorpay",
        currency: "INR",
      });
      setCurrentInitDto(initDto);
      setPendingPaymentOrder(order);

      const rzpLoaded = await loadRazorpayScript();
      if (rzpLoaded && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay({
          key: initDto.keyId,
          amount: initDto.amountSubunits,
          currency: initDto.currency,
          name: "Veyora Haute Couture",
          description: `Order #${initDto.orderNumber}`,
          order_id: initDto.gatewayOrderId,
          prefill: {
            name: initDto.customer?.name,
            email: initDto.customer?.email,
            contact: initDto.customer?.phone,
          },
          theme: {
            color: "#0a0a0a",
          },
          handler: async function (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) {
            try {
              setIsProcessingPayment(true);
              const verification = await verifyPaymentAsync({
                orderId: initDto.orderId,
                gatewayOrderId: response.razorpay_order_id,
                gatewayPaymentId: response.razorpay_payment_id,
                gatewaySignature: response.razorpay_signature,
              });

              notifyApiSuccess(verification);
              setVerifiedPayment(verification);
              setCompletedOrder({ ...order, status: "confirmed" });
              setPendingPaymentOrder(null);
              clearCart();
            } catch (err: unknown) {
              notifyApiError(err);
            } finally {
              setIsProcessingPayment(false);
            }
          },
          modal: {
            ondismiss: function () {
              notifyWarning("Payment has not been completed.");
              setIsProcessingPayment(false);
            },
          },
        });

        rzp.on("payment.failed", function (_response: any) {
          notifyApiError(
            {
              code: "PAYMENT_FAILED",
              statusCode: 400,
            },
            "Unable to complete payment. Please try again."
          );
          setIsProcessingPayment(false);
        });

        rzp.open();
      } else {
        // Fallback simulation dialog for offline/dev test environment
        setSimulatedModalOpen(true);
      }
    } catch (err: unknown) {
      notifyApiError(err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleConfirmSimulatedPayment = async () => {
    if (!currentInitDto || !pendingPaymentOrder) return;
    try {
      setIsProcessingPayment(true);
      const simulatedPaymentId = `pay_sim_${crypto.randomUUID().slice(0, 8)}`;
      const simulatedSignature = `dev_simulated_${currentInitDto.orderId}_${simulatedPaymentId}`;

      const verification = await verifyPaymentAsync({
        orderId: currentInitDto.orderId,
        gatewayOrderId: currentInitDto.gatewayOrderId,
        gatewayPaymentId: simulatedPaymentId,
        gatewaySignature: simulatedSignature,
      });

      notifyApiSuccess(verification);
      setVerifiedPayment(verification);
      setCompletedOrder({ ...pendingPaymentOrder, status: "confirmed" });
      setPendingPaymentOrder(null);
      setSimulatedModalOpen(false);
      clearCart();
    } catch (err: unknown) {
      notifyApiError(err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!mounted) {
    return (
      <div className="py-16">
        <Container size="xl" className="space-y-6">
          <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-96 rounded-3xl bg-muted/40 animate-pulse" />
        </Container>
      </div>
    );
  }

  // Confirmation View
  if (completedOrder) {
    return (
      <div className="py-20 md:py-28">
        <Container size="sm" className="space-y-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10 stroke-[2]" />
          </div>

          <div className="space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Order Confirmed & Settled // {completedOrder.orderNumber}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Thank You for Your Patronage
            </h1>
            <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
              We have dispatched your verified receipt to{" "}
              <strong className="text-foreground">{completedOrder.customerEmail}</strong>. Payment
              has been cryptographically confirmed and our climate-controlled atelier has commenced
              tailored fulfillment.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 text-left space-y-4 max-w-md mx-auto text-xs shadow-sm">
            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Payment Verification</span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] flex items-center gap-1"
              >
                <ShieldCheck className="h-3 w-3" />
                <span>HMAC VERIFIED & SETTLED</span>
              </Badge>
            </div>

            {verifiedPayment?.gatewayPaymentId && (
              <div className="flex justify-between border-b border-border/60 pb-3">
                <span className="text-muted-foreground">Gateway Payment ID</span>
                <span className="font-mono text-[11px] text-foreground font-semibold">
                  {verifiedPayment.gatewayPaymentId}
                </span>
              </div>
            )}

            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Courier Service</span>
              <span className="font-semibold text-foreground">
                {completedOrder.shippingMethod === "express"
                  ? "Atelier Express Priority (1-2 Days)"
                  : "Carbon-Neutral Ground Courier (3-5 Days)"}
              </span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-semibold text-foreground">
                {completedOrder.shippingAddress.firstName} {completedOrder.shippingAddress.lastName}
              </span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Destination</span>
              <span className="font-semibold text-foreground">
                {completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.city},{" "}
                {completedOrder.shippingAddress.state} {completedOrder.shippingAddress.postalCode}
              </span>
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">Total Authorized</span>
              <span className="font-bold text-base text-foreground tabular-nums">
                ${completedOrder.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="rounded-full px-8 text-xs font-semibold">
              <Link href="/orders">Inspect Order Status & Telemetry</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8 text-xs font-semibold"
            >
              <Link href="/shop">Continue Exploring Haute Couture</Link>
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // Empty Bag View
  if (cartItems.length === 0) {
    return (
      <div className="py-20 text-center">
        <Container size="sm" className="space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Your shopping bag is empty</h1>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Select garments from our seasonal collection before proceeding through atelier
              checkout.
            </p>
          </div>
          <Button asChild className="rounded-full px-8 text-xs font-semibold">
            <Link href="/shop">Explore Haute Couture</Link>
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 md:py-16 space-y-8">
      <Container size="xl" className="space-y-8">
        {/* Navigation & Encryption Header */}
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
            <span>Secure checkout and payment processing</span>
          </div>
        </div>

        {/* Validation Warning Alert if items unavailable */}
        {warnings && warnings.length > 0 && (
          <Alert
            variant="destructive"
            className="rounded-2xl border-destructive/40 bg-destructive/10"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-xs font-bold uppercase tracking-wider">
              Inventory Notice
            </AlertTitle>
            <AlertDescription className="text-xs space-y-1">
              {warnings.map((w, idx) => (
                <p key={idx}>{w}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-7 space-y-8">
              {/* 1. Contact Information */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    1. Contact Information
                  </h2>
                  {isAuthenticated && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-primary/30 text-primary"
                    >
                      AUTHENTICATED PATRON
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="email" className="text-xs font-medium">
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
                      Order confirmation telemetry and climate shipment alerts will be dispatched
                      here.
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="phone" className="text-xs font-medium">
                      Phone Number (for courier delivery notifications)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-xl text-xs h-10"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Shipping Destination */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>2. Delivery Destination</span>
                  </h2>
                </div>

                {/* Saved Address Selector (if any saved addresses) */}
                {addresses.length > 0 && (
                  <div className="space-y-3 pb-2 border-b border-border/60">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Saved Atelier Addresses
                    </span>
                    <RadioGroup
                      value={selectedAddressId}
                      onValueChange={(val) => setSelectedAddressId(val)}
                      className="grid grid-cols-1 gap-2.5"
                    >
                      {addresses.map((addr: AddressDto) => (
                        <div
                          key={addr.id}
                          className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? "border-primary bg-primary/5 shadow-xs"
                              : "border-border/70 hover:bg-muted/30"
                          }`}
                          onClick={() => setSelectedAddressId(addr.id)}
                        >
                          <RadioGroupItem
                            value={addr.id}
                            id={`addr-${addr.id}`}
                            className="mt-0.5"
                          />
                          <Label
                            htmlFor={`addr-${addr.id}`}
                            className="cursor-pointer text-xs space-y-1 flex-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">
                                {addr.firstName} {addr.lastName}
                              </span>
                              {addr.isDefault && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 font-mono"
                                >
                                  DEFAULT
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                              {addr.street}
                              {addr.apartment ? `, ${addr.apartment}` : ""}, {addr.city},{" "}
                              {addr.state} {addr.postalCode}, {addr.country}
                            </p>
                            {addr.phone && (
                              <p className="text-[10px] text-muted-foreground font-mono">
                                Ph: {addr.phone}
                              </p>
                            )}
                          </Label>
                        </div>
                      ))}

                      <div
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all ${
                          selectedAddressId === "new"
                            ? "border-primary bg-primary/5"
                            : "border-border/70 hover:bg-muted/30"
                        }`}
                        onClick={() => setSelectedAddressId("new")}
                      >
                        <RadioGroupItem value="new" id="addr-new" />
                        <Label
                          htmlFor="addr-new"
                          className="cursor-pointer text-xs font-medium flex items-center gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5 text-primary" />
                          <span>Deliver to a New Atelier Destination</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* New Address Fields (Rendered when no addresses or selectedAddressId === 'new') */}
                {(addresses.length === 0 || selectedAddressId === "new") && (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-xs font-medium">
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          required
                          placeholder="Priya"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-xs font-medium">
                          Last Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          required
                          placeholder="Sharma"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="street" className="text-xs font-medium">
                        Street Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="street"
                        required
                        placeholder="Flat 402, Lotus Grandeur, 14th Main Road"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="rounded-xl text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="apartment" className="text-xs font-medium">
                        Apartment, Suite, Unit (Optional)
                      </Label>
                      <Input
                        id="apartment"
                        placeholder="Tower B, Indiranagar"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        className="rounded-xl text-xs h-10"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs font-medium">
                          City <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="city"
                          required
                          placeholder="Bengaluru"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="state" className="text-xs font-medium">
                          State / Region <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="state"
                          required
                          placeholder="Karnataka"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>

                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label htmlFor="postalCode" className="text-xs font-medium">
                          Postal Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="postalCode"
                          required
                          placeholder="560038"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="country" className="text-xs font-medium">
                        Country / Territory <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="country"
                        required
                        placeholder="India"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="rounded-xl text-xs h-10"
                      />
                    </div>

                    {isAuthenticated && (
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="saveToAddresses"
                          checked={saveToAddresses}
                          onCheckedChange={(checked) => setSaveToAddresses(Boolean(checked))}
                        />
                        <Label
                          htmlFor="saveToAddresses"
                          className="text-xs font-normal text-muted-foreground cursor-pointer"
                        >
                          Save this delivery address to my Veyora patron profile
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Delivery Method */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>3. Delivery Method</span>
                  </h2>
                </div>

                <RadioGroup
                  value={shippingMethod}
                  onValueChange={(v) => setShippingMethod(v as "standard" | "express")}
                  className="space-y-2.5"
                >
                  {shippingOptions && shippingOptions.length > 0 ? (
                    shippingOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className={`flex items-center justify-between rounded-2xl border p-4 transition-all cursor-pointer ${
                          shippingMethod === opt.id
                            ? "border-primary bg-primary/5"
                            : "border-border/80 hover:bg-muted/30"
                        }`}
                        onClick={() => setShippingMethod(opt.id)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} />
                          <Label
                            htmlFor={`opt-${opt.id}`}
                            className="cursor-pointer text-xs space-y-0.5"
                          >
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{opt.name}</span>
                              {opt.id === "express" && (
                                <Sparkles className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                            <div className="text-muted-foreground text-[11px]">
                              {opt.description}
                            </div>
                          </Label>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-foreground">
                          {opt.price === 0 ? "Complimentary" : `$${opt.price.toFixed(2)}`}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div
                        className={`flex items-center justify-between rounded-2xl border p-4 transition-all cursor-pointer ${
                          shippingMethod === "standard"
                            ? "border-primary bg-primary/5"
                            : "border-border/80 hover:bg-muted/30"
                        }`}
                        onClick={() => setShippingMethod("standard")}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="standard" id="shipping-standard" />
                          <Label
                            htmlFor="shipping-standard"
                            className="cursor-pointer text-xs space-y-0.5"
                          >
                            <div className="font-semibold text-foreground">
                              Carbon-Neutral Ground Courier
                            </div>
                            <div className="text-muted-foreground text-[11px]">
                              3–5 business days with insured tracking
                            </div>
                          </Label>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-foreground">
                          {subtotal >= 150 ? "Complimentary" : "$15.00"}
                        </span>
                      </div>

                      <div
                        className={`flex items-center justify-between rounded-2xl border p-4 transition-all cursor-pointer ${
                          shippingMethod === "express"
                            ? "border-primary bg-primary/5"
                            : "border-border/80 hover:bg-muted/30"
                        }`}
                        onClick={() => setShippingMethod("express")}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="express" id="shipping-express" />
                          <Label
                            htmlFor="shipping-express"
                            className="cursor-pointer text-xs space-y-0.5"
                          >
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>Atelier Priority Air Express</span>
                              <Sparkles className="h-3 w-3 text-amber-500" />
                            </div>
                            <div className="text-muted-foreground text-[11px]">
                              1–2 business days prioritized handling
                            </div>
                          </Label>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-foreground">
                          $25.00
                        </span>
                      </div>
                    </>
                  )}
                </RadioGroup>
              </div>

              {/* 4. Billing Information */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-sm">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  4. Billing Destination
                </h2>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAsShipping"
                    checked={sameAsShipping}
                    onCheckedChange={(checked) => setSameAsShipping(Boolean(checked))}
                  />
                  <Label
                    htmlFor="sameAsShipping"
                    className="text-xs font-normal text-muted-foreground cursor-pointer"
                  >
                    Billing address is identical to shipping destination
                  </Label>
                </div>

                {!sameAsShipping && (
                  <div className="space-y-4 pt-3 border-t border-border/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="billingFirstName" className="text-xs font-medium">
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="billingFirstName"
                          required
                          value={billingFirstName}
                          onChange={(e) => setBillingFirstName(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="billingLastName" className="text-xs font-medium">
                          Last Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="billingLastName"
                          required
                          value={billingLastName}
                          onChange={(e) => setBillingLastName(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="billingStreet" className="text-xs font-medium">
                        Street Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="billingStreet"
                        required
                        value={billingStreet}
                        onChange={(e) => setBillingStreet(e.target.value)}
                        className="rounded-xl text-xs h-10"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="billingCity" className="text-xs font-medium">
                          City <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="billingCity"
                          required
                          value={billingCity}
                          onChange={(e) => setBillingCity(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="billingState" className="text-xs font-medium">
                          State <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="billingState"
                          required
                          value={billingState}
                          onChange={(e) => setBillingState(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label htmlFor="billingPostalCode" className="text-xs font-medium">
                          Postal Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="billingPostalCode"
                          required
                          value={billingPostalCode}
                          onChange={(e) => setBillingPostalCode(e.target.value)}
                          className="rounded-xl text-xs h-10"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Special Atelier Requests / Notes */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-3 shadow-sm">
                <Label htmlFor="customerNote" className="text-xs font-bold text-foreground">
                  Order Instructions & Packaging Notes (Optional)
                </Label>
                <Input
                  id="customerNote"
                  placeholder="e.g., Leave package with security desk, eco-friendly unboxing"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="rounded-xl text-xs h-10"
                />
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                size="lg"
                disabled={
                  isPlacingOrder ||
                  isProcessingPayment ||
                  (validation !== undefined && !isCheckoutValid)
                }
                className="w-full rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 h-13"
              >
                {isPlacingOrder || isProcessingPayment ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {isPlacingOrder
                        ? "Verifying Atelier Stock & Placing Order..."
                        : "Connecting to Secure Payment Gateway..."}
                    </span>
                  </span>
                ) : (
                  `Proceed to Secure Payment • $${total.toFixed(2)}`
                )}
              </Button>
            </div>

            {/* Right Column: Order Line Items & Financial Breakdown */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    Order Summary
                  </h2>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                    {cartItems.reduce((acc, i) => acc + i.quantity, 0)} garments
                  </span>
                </div>

                {/* Line Items */}
                <div className="max-h-72 overflow-y-auto divide-y divide-border/60 pr-1 space-y-0.5">
                  {cartItems.map((item) => (
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

                {/* Financial Ledger Calculation */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground font-semibold tabular-nums">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Privilege Discount</span>
                      <span className="tabular-nums">-${discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Insured Courier Delivery</span>
                    <span className="tabular-nums">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Complimentary
                        </span>
                      ) : (
                        `$${shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Tax (8%)</span>
                    <span className="tabular-nums">${tax.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex items-baseline justify-between text-sm font-bold text-foreground">
                    <span>Authorized Total</span>
                    <span className="text-xl tabular-nums">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Product details and care guidance are listed per garment</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Fallback Simulation Dialog for Offline / Dev Environments */}
        <Dialog open={simulatedModalOpen} onOpenChange={setSimulatedModalOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span>Veyora Secure Payment Gateway</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Razorpay Test Mode // Order #{currentInitDto?.orderNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-2xl border border-border/70 p-4 space-y-2 bg-muted/20">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-semibold uppercase text-foreground">Razorpay Test</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gateway Order ID:</span>
                  <span className="font-mono text-foreground">
                    {currentInitDto?.gatewayOrderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Settlement:</span>
                  <span className="font-bold text-foreground tabular-nums">
                    ${currentInitDto?.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This transaction will be cryptographically verified with constant-time HMAC-SHA256
                signature verification on the Veyora API server before the order transitions to
                confirmed.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSimulatedModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSimulatedPayment}
                disabled={isProcessingPayment}
                className="rounded-xl text-xs font-semibold"
              >
                {isProcessingPayment ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying Signature...</span>
                  </span>
                ) : (
                  "Simulate & Verify Payment"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Container>
    </div>
  );
}
