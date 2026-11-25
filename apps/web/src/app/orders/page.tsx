"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ProtectedRoute } from "@/components/common/protected-route";
import { useOrders } from "@/lib/hooks/use-orders";
import { OrderDto, OrderStatus } from "@veyora/types";
import {
  ShoppingBag,
  Clock,
  Sparkles,
  RefreshCw,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  MapPin,
  ChevronRight,
  Search,
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
    label: "Dispatched & In Transit",
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

export default function CustomerOrdersPage() {
  const { orders, isLoading, cancelOrderAsync, isCancelling } = useOrders();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Cancel dialog
  const [cancelModalOrder, setCancelModalOrder] = React.useState<OrderDto | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesNum = order.orderNumber.toLowerCase().includes(query);
        const matchesItems = order.items.some((i) => i.title.toLowerCase().includes(query));
        if (!matchesNum && !matchesItems) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    try {
      await cancelOrderAsync(cancelModalOrder.id, { reason: cancelReason || undefined });
      setCancelModalOrder(null);
      setCancelReason("");
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <ProtectedRoute>
      <div className="py-10 md:py-16 space-y-8">
        <Container size="xl" className="space-y-8">
          {/* Page Title & Breadcrumb */}
          <div className="space-y-2 border-b border-border/60 pb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">My Atelier Orders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Order History & Tracking
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg">
              Track fulfillment progress, inspect luxury garment specifications, and oversee order
              status.
            </p>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Order # or garment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                "all",
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 capitalize ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Listing */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-3xl bg-muted/40 animate-pulse border border-border/60"
                />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border border-dashed border-border/80 bg-muted/10 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">No orders found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {orders.length === 0
                    ? "You have not placed any orders with our atelier yet."
                    : "No orders match the current filter selection."}
                </p>
              </div>
              {orders.length === 0 && (
                <Button asChild size="sm" className="rounded-full px-6 text-xs font-semibold">
                  <Link href="/shop">Explore Seasonal Collection</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                const isCancellable = order.status === "pending" || order.status === "confirmed";

                return (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:border-border transition-all space-y-4"
                  >
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-foreground">
                            {order.orderNumber}
                          </span>
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 font-medium ${cfg.badgeClass}`}
                          >
                            <Icon className="h-3 w-3" />
                            <span>{cfg.label}</span>
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Placed on{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-xs h-9"
                        >
                          <Link href={`/orders/${order.id}`}>
                            <span>View Details & Tracking</span>
                            <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>

                        {isCancellable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCancelModalOrder(order);
                              setCancelReason("");
                            }}
                            className="rounded-xl text-xs h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                          >
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Card Body: Items Preview & Destination */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Items Thumbnails */}
                      <div className="md:col-span-8 flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2.5 shrink-0">
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
                                <div className="flex h-full w-full items-center justify-center font-mono text-[9px] text-muted-foreground">
                                  VY
                                </div>
                              )}
                            </div>
                            <div className="text-xs space-y-0.5 max-w-[140px]">
                              <p className="font-semibold text-foreground line-clamp-1">
                                {item.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Qty: {item.quantity} {item.size && `• ${item.size}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Address & Total */}
                      <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-6 text-xs border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="text-right">
                          <span className="text-[11px] text-muted-foreground block">
                            Destination
                          </span>
                          <span className="font-medium text-foreground flex items-center justify-end gap-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span>
                              {order.shippingAddress.city}, {order.shippingAddress.state}
                            </span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-muted-foreground block">
                            Authorized Total
                          </span>
                          <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                            ${order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>

        {/* Cancel Order Dialog */}
        {cancelModalOrder && (
          <Dialog open={Boolean(cancelModalOrder)} onOpenChange={() => setCancelModalOrder(null)}>
            <DialogContent className="max-w-md rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-foreground">
                  Cancel Order // {cancelModalOrder.orderNumber}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Are you sure you wish to cancel this atelier reservation? Reserved garment stock
                  will be immediately released.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleConfirmCancel} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cancelReason" className="text-xs font-semibold">
                    Reason for Cancellation (Optional)
                  </Label>
                  <Input
                    id="cancelReason"
                    placeholder="e.g. Changed size preference, incorrect shipping destination"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCancelModalOrder(null)}
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
