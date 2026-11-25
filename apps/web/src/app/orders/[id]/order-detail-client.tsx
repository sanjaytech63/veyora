"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useOrderDetail } from "@/lib/hooks/use-orders";
import { OrderStatus } from "@veyora/types";
import { ProtectedRoute } from "@/components/common/protected-route";
import {
  ArrowLeft,
  Clock,
  Sparkles,
  RefreshCw,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from "lucide-react";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  pending: {
    label: "Awaiting Confirmation",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed by Atelier",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Sparkles,
  },
  processing: {
    label: "Atelier Tailoring",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    icon: RefreshCw,
  },
  shipped: {
    label: "In Transit / Shipped",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: XCircle,
  },
  refund_pending: {
    label: "Refund Requested",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    icon: RotateCcw,
  },
  refunded: {
    label: "Refund Settled",
    badgeClass: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    icon: CheckCircle2,
  },
};

const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Order Placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "processing", label: "Tailoring" },
  { status: "shipped", label: "Dispatched" },
  { status: "delivered", label: "Delivered" },
];

export function CustomerOrderDetailClient({ orderId }: { orderId: string }) {
  const { order, isLoading, isError, error, refetch, cancelOrderAsync, isCancelling } =
    useOrderDetail(orderId);

  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="py-16">
          <Container size="xl" className="space-y-6">
            <div className="h-6 w-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-72 rounded-xl bg-muted animate-pulse" />
            <div className="h-96 rounded-3xl bg-muted/40 animate-pulse" />
          </Container>
        </div>
      </ProtectedRoute>
    );
  }

  if (isError) {
    const errorStatus =
      (error as { statusCode?: number })?.statusCode ||
      (error as { response?: { status?: number } })?.response?.status;
    const errorMsg = error instanceof Error ? error.message.toLowerCase() : "";
    const isNotFound = errorStatus === 404 || errorMsg.includes("not found");
    const isForbidden =
      errorStatus === 403 || errorMsg.includes("forbidden") || errorMsg.includes("access");

    if (isForbidden) {
      return (
        <ProtectedRoute>
          <div className="py-20 text-center" role="alert" aria-live="assertive">
            <Container size="sm" className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
                <ShieldCheck className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-foreground">Order Access Restricted</h1>
                <p className="text-xs text-muted-foreground">
                  You do not possess clearance to view this order record.
                </p>
              </div>
              <Button asChild className="rounded-full px-6 text-xs font-semibold">
                <Link href="/orders">Back to Order History</Link>
              </Button>
            </Container>
          </div>
        </ProtectedRoute>
      );
    }

    if (isNotFound) {
      return (
        <ProtectedRoute>
          <div className="py-20 text-center" role="region" aria-live="polite">
            <Container size="sm" className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                <XCircle className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold">Order Not Located</h1>
                <p className="text-xs text-muted-foreground">
                  We could not find the requested order telemetry in your atelier account.
                </p>
              </div>
              <Button asChild className="rounded-full px-6 text-xs font-semibold">
                <Link href="/orders">Back to Order History</Link>
              </Button>
            </Container>
          </div>
        </ProtectedRoute>
      );
    }

    return (
      <ProtectedRoute>
        <div className="py-20 text-center" role="alert" aria-live="assertive">
          <Container size="sm" className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <RefreshCw className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground">Order Telemetry Interrupted</h1>
              <p className="text-xs text-muted-foreground">
                Unable to synchronize order telemetry with the atelier. Please verify your
                connection or retry.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                onClick={() => refetch()}
                className="rounded-full px-6 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry Sync
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6 text-xs font-semibold">
                <Link href="/orders">Back to Orders</Link>
              </Button>
            </div>
          </Container>
        </div>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <div className="py-20 text-center" role="region" aria-live="polite">
          <Container size="sm" className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
              <XCircle className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Order Not Located</h1>
              <p className="text-xs text-muted-foreground">
                We could not find the requested order telemetry in your atelier account.
              </p>
            </div>
            <Button asChild className="rounded-full px-6 text-xs font-semibold">
              <Link href="/orders">Back to Order History</Link>
            </Button>
          </Container>
        </div>
      </ProtectedRoute>
    );
  }

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const isCancellable = order.status === "pending" || order.status === "confirmed";

  // Compute active milestone step index
  const statusIndexMap: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
  };
  const activeStep = statusIndexMap[order.status] ?? (order.status === "cancelled" ? -1 : 0);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cancelOrderAsync({ reason: cancelReason || undefined });
      setCancelDialogOpen(false);
      setCancelReason("");
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <ProtectedRoute>
      <div className="py-10 md:py-16 space-y-8">
        <Container size="xl" className="space-y-8">
          {/* Navigation & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="space-y-1.5">
              <Link
                href="/orders"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to All Orders</span>
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
                  {order.orderNumber}
                </h1>
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1.5 text-[11px] px-3 py-0.5 font-medium ${cfg.badgeClass}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cfg.label}</span>
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>
                  Placed on{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  at{" "}
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>

            {isCancellable && (
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(true)}
                className="rounded-2xl text-xs font-semibold h-10 border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
              >
                Cancel Reservation
              </Button>
            )}
          </div>

          {/* Visual Fulfillment Tracker (when not cancelled) */}
          {order.status !== "cancelled" && (
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Atelier Fulfillment Progress
              </span>
              <div className="grid grid-cols-5 gap-2 relative">
                {ORDER_STEPS.map((step, idx) => {
                  const isPassed = activeStep >= idx;
                  const isCurrent = activeStep === idx;
                  return (
                    <div
                      key={step.status}
                      className="flex flex-col items-center text-center space-y-2 relative"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-105"
                            : isPassed
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isPassed && !isCurrent ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          isCurrent
                            ? "text-primary font-bold"
                            : isPassed
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancellation Notice Banner */}
          {order.status === "cancelled" && (
            <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                <XCircle className="h-4 w-4" />
                <span>This order was cancelled</span>
              </div>
              {order.cancelReason && (
                <p className="text-muted-foreground">
                  Reason provided: &ldquo;{order.cancelReason}&rdquo;
                </p>
              )}
              {order.cancelledAt && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  Cancelled on {new Date(order.cancelledAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Items & Destination */}
            <div className="lg:col-span-7 space-y-6">
              {/* Garment Items Card */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    Purchased Garments
                  </h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    {order.items.reduce((acc, i) => acc + i.quantity, 0)} items
                  </span>
                </div>

                <div className="divide-y divide-border/60">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted/40">
                          {item.image ? (
                            <OptimizedImage
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover object-center"
                              sizes="64px"
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
                          <p className="text-xs font-semibold text-foreground">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            SKU: <span className="font-mono">{item.sku}</span>
                            {item.size && ` • Size: ${item.size}`}
                            {item.color && ` • Color: ${item.color}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <div className="font-bold text-foreground tabular-nums">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          ${item.price.toFixed(2)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address Destinations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-border/80 bg-card p-5 space-y-2 text-xs shadow-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>Delivery Destination</span>
                  </span>
                  <p className="font-medium text-foreground">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {order.shippingAddress.street}
                    {order.shippingAddress.apartment && `, ${order.shippingAddress.apartment}`}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                    <br />
                    {order.shippingAddress.country}
                  </p>
                  {order.shippingAddress.phone && (
                    <p className="text-muted-foreground font-mono text-[11px] pt-1">
                      Phone: {order.shippingAddress.phone}
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-border/80 bg-card p-5 space-y-2 text-xs shadow-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Billing Address</span>
                  </span>
                  <p className="font-medium text-foreground">
                    {order.billingAddress.firstName} {order.billingAddress.lastName}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {order.billingAddress.street}
                    {order.billingAddress.apartment && `, ${order.billingAddress.apartment}`}
                    <br />
                    {order.billingAddress.city}, {order.billingAddress.state}{" "}
                    {order.billingAddress.postalCode}
                    <br />
                    {order.billingAddress.country}
                  </p>
                </div>
              </div>

              {/* Status History Timeline */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>Order Activity & Transition History</span>
                </h3>

                <div className="space-y-3 text-xs">
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    order.statusHistory.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 border-b border-border/50 pb-3 last:border-b-0 last:pb-0"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          {idx + 1}
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground uppercase tracking-wide text-[11px]">
                              {step.toStatus}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(step.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {step.reason && (
                            <p className="text-[11px] text-muted-foreground italic">
                              &ldquo;{step.reason}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-xs">Order placed in atelier queue.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Tracking Telemetry & Financial Breakdown */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              {/* Courier Tracking Card */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>Courier Telemetry</span>
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Selected Courier</span>
                    <span className="font-semibold text-foreground">
                      {order.shippingMethod === "express"
                        ? "Atelier Express Priority"
                        : "Carbon-Neutral Ground Courier"}
                    </span>
                  </div>

                  {order.tracking?.carrier && (
                    <div className="flex justify-between">
                      <span>Courier Service</span>
                      <span className="font-semibold text-foreground">
                        {order.tracking.carrier}
                      </span>
                    </div>
                  )}

                  {order.tracking?.trackingNumber && (
                    <div className="flex justify-between">
                      <span>Airway Bill / Tracking</span>
                      <span className="font-mono font-bold text-foreground">
                        {order.tracking.trackingNumber}
                      </span>
                    </div>
                  )}

                  {order.tracking?.estimatedDeliveryDate && (
                    <div className="flex justify-between">
                      <span>Estimated Arrival</span>
                      <span className="font-medium text-foreground">
                        {order.tracking.estimatedDeliveryDate}
                      </span>
                    </div>
                  )}

                  {order.tracking?.trackingNumber && (
                    <div className="pt-2 flex flex-col gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="default"
                        className="w-full rounded-xl text-xs"
                      >
                        <Link href={`/tracking`}>
                          <Truck className="h-3.5 w-3.5 mr-1.5" />
                          <span>Track Parcel Live</span>
                        </Link>
                      </Button>
                      {order.tracking.trackingUrl && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="w-full rounded-xl text-xs"
                        >
                          <a
                            href={order.tracking.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>External Carrier Portal</span>
                            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary Card */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  Settlement Summary
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground font-semibold tabular-nums">
                      ${order.subtotal.toFixed(2)}
                    </span>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Privilege Discount</span>
                      <span className="tabular-nums">-${order.discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Courier Delivery</span>
                    <span>
                      {order.shippingCost === 0
                        ? "Complimentary"
                        : `$${order.shippingCost.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Tax</span>
                    <span className="tabular-nums">${order.tax.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex items-baseline justify-between text-sm font-bold text-foreground pt-1">
                    <span>Authorized Total</span>
                    <span className="text-xl tabular-nums font-mono">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>

        {/* Cancellation Dialog */}
        {cancelDialogOpen && (
          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent className="max-w-md rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-foreground">
                  Cancel Order // {order.orderNumber}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Cancelling this order will release your garment reservations back into
                  circulation.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCancelSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="custCancelReason" className="text-xs font-semibold">
                    Reason for Cancellation (Optional)
                  </Label>
                  <Input
                    id="custCancelReason"
                    placeholder="e.g. Changed size, incorrect shipping address"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCancelDialogOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Keep Order
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isCancelling}
                    className="rounded-xl text-xs font-semibold"
                  >
                    {isCancelling ? "Cancelling Order..." : "Confirm Cancellation"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedRoute>
  );
}
