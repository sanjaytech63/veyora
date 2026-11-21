"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { adminOrdersApi } from "@/lib/api/admin-orders-api";
import {
  OrderDto,
  OrderStatus,
  UpdateOrderStatusPayload,
} from "@veyora/types";
import {
  Search,
  Eye,
  RefreshCw,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "refund_pending"],
  delivered: ["refund_pending"],
  refund_pending: ["refunded", "delivered"],
  cancelled: [],
  refunded: [],
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending Atelier Review",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
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

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  // Modal states
  const [selectedOrder, setSelectedOrder] = React.useState<OrderDto | null>(null);
  const [statusModalOpen, setStatusModalOpen] = React.useState(false);
  const [orderToUpdate, setOrderToUpdate] = React.useState<OrderDto | null>(null);

  // Status Form state
  const [newStatus, setNewStatus] = React.useState<OrderStatus | "">("");
  const [statusReason, setStatusReason] = React.useState("");
  const [carrier, setCarrier] = React.useState("Bluedart Priority Apex");
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [trackingUrl, setTrackingUrl] = React.useState("");
  const [estimatedDelivery, setEstimatedDelivery] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch orders from API
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-orders", statusFilter, debouncedSearch, page],
    queryFn: () =>
      adminOrdersApi.listOrders({
        page,
        limit: 20,
        status: statusFilter !== "all" ? (statusFilter as OrderStatus) : undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const orders = data?.items || [];
  const total = data?.total || 0;

  // Mutation: update status
  const updateStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: UpdateOrderStatusPayload;
    }) => adminOrdersApi.updateOrderStatus(orderId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated", {
        description: `Order #${updated.orderNumber} is now ${updated.status}.`,
      });
      setStatusModalOpen(false);
      setOrderToUpdate(null);
      if (selectedOrder && selectedOrder.id === updated.id) {
        setSelectedOrder(updated);
      }
    },
    onError: (err: Error) => {
      toast.error("Status update rejected", {
        description: err.message || "Invalid state machine transition.",
      });
    },
  });

  const handleOpenStatusModal = (order: OrderDto) => {
    setOrderToUpdate(order);
    const allowed = VALID_STATUS_TRANSITIONS[order.status] || [];
    setNewStatus(allowed[0] || "");
    setStatusReason("");
    setTrackingNumber(order.tracking?.trackingNumber || "");
    setCarrier(order.tracking?.carrier || "Bluedart Priority Apex");
    setTrackingUrl(order.tracking?.trackingUrl || "");
    setEstimatedDelivery(order.tracking?.estimatedDeliveryDate || "");
    setStatusModalOpen(true);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToUpdate || !newStatus) return;

    updateStatusMutation.mutate({
      orderId: orderToUpdate.id,
      payload: {
        status: newStatus as OrderStatus,
        reason: statusReason || undefined,
        trackingCarrier: newStatus === "shipped" ? carrier : undefined,
        trackingNumber: newStatus === "shipped" ? trackingNumber : undefined,
        trackingUrl: newStatus === "shipped" ? trackingUrl || undefined : undefined,
        estimatedDeliveryDate: newStatus === "shipped" ? estimatedDelivery || undefined : undefined,
      },
    });
  };

  return (
    <PageContainer
      title="Order Management"
      description="Supervise garment fulfillment, inspect patron orders, and govern order state machine transitions."
    >
      <div className="space-y-6">
        {/* Filter Controls Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by Order #, Patron Name, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-56 h-10 rounded-xl text-xs">
                <SelectValue placeholder="All Order Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Order Statuses</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Tailoring / Processing</SelectItem>
                <SelectItem value="shipped">In Transit / Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refund_pending">Refund Requested</SelectItem>
                <SelectItem value="refunded">Refund Settled</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="h-10 w-10 shrink-0 rounded-xl"
              title="Refresh Orders"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold text-xs">Order ID</TableHead>
                <TableHead className="font-semibold text-xs">Patron & Destination</TableHead>
                <TableHead className="font-semibold text-xs">Garments</TableHead>
                <TableHead className="font-semibold text-xs">Courier Method</TableHead>
                <TableHead className="font-semibold text-xs">Settlement Total</TableHead>
                <TableHead className="font-semibold text-xs">Status</TableHead>
                <TableHead className="text-right font-semibold text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading orders telemetry...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-xs text-destructive">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                    Failed to retrieve orders. Please check API connection.
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                    No orders found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];

                  return (
                    <TableRow key={order.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {order.orderNumber}
                        <div className="text-[10px] font-normal text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()} at{" "}
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{order.customerName}</div>
                        <div className="text-[11px] text-muted-foreground">{order.customerEmail}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          <span>{order.shippingAddress.city}, {order.shippingAddress.state}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <span className="font-semibold text-foreground">
                          {order.items.reduce((acc, i) => acc + i.quantity, 0)} items
                        </span>
                        <div className="text-[10px] text-muted-foreground line-clamp-1 max-w-[180px]">
                          {order.items.map((i) => i.title).join(", ")}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <span className="capitalize font-medium">
                          {order.shippingMethod === "express" ? "Atelier Express" : "Standard Ground"}
                        </span>
                        {order.tracking?.carrier && (
                          <div className="text-[10px] text-muted-foreground">
                            {order.tracking.carrier}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-xs font-bold font-mono tabular-nums text-foreground">
                        ${order.total.toFixed(2)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1.5 w-fit text-[10px] px-2 py-0.5 font-medium ${cfg.badgeClass}`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{cfg.label}</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>Details</span>
                          </Button>

                          {allowedTransitions.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenStatusModal(order)}
                              className="h-8 px-2.5 text-xs font-semibold rounded-lg"
                            >
                              Transition Status
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          {total > 20 && (
            <div className="flex items-center justify-between p-4 border-t border-border/70 text-xs text-muted-foreground">
              <span>Showing {orders.length} of {total} orders</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 rounded-lg text-xs"
                >
                  Previous
                </Button>
                <span className="font-mono px-2">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 20 >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 rounded-lg text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1. ORDER DETAILS DIALOG */}
      {selectedOrder && (
        <Dialog open={Boolean(selectedOrder)} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <span>Order // {selectedOrder.orderNumber}</span>
                  {(() => {
                    const cfg = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.pending;
                    return (
                      <Badge variant="outline" className={`text-[10px] ${cfg.badgeClass}`}>
                        {cfg.label}
                      </Badge>
                    );
                  })()}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Garment Line Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Purchased Haute Couture Garments
                </h4>
                <div className="divide-y divide-border/60 rounded-2xl border border-border/70 p-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                          {item.image ? (
                            <OptimizedImage
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover object-center"
                              sizes="48px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-mono text-[9px] text-muted-foreground">
                              VY
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            SKU: {item.sku} {item.size && `• Size: ${item.size}`} {item.color && `• Color: ${item.color}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <span className="font-semibold tabular-nums text-foreground">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          {item.quantity} × ${item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Destination & Tracking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/70 p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>Shipping Destination</span>
                  </h4>
                  <p className="font-medium text-foreground">
                    {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedOrder.shippingAddress.street}
                    {selectedOrder.shippingAddress.apartment && `, ${selectedOrder.shippingAddress.apartment}`}<br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{" "}
                    {selectedOrder.shippingAddress.postalCode}<br />
                    {selectedOrder.shippingAddress.country}
                  </p>
                  {selectedOrder.shippingAddress.phone && (
                    <p className="text-muted-foreground font-mono text-[11px]">
                      Contact: {selectedOrder.shippingAddress.phone}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-border/70 p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-primary" />
                    <span>Courier Telemetry & Tracking</span>
                  </h4>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.shippingMethod === "express" ? "Priority Express" : "Standard Ground"}
                      </span>
                    </div>
                    {selectedOrder.tracking?.carrier && (
                      <div className="flex justify-between">
                        <span>Courier Partner:</span>
                        <span className="font-semibold text-foreground">{selectedOrder.tracking.carrier}</span>
                      </div>
                    )}
                    {selectedOrder.tracking?.trackingNumber && (
                      <div className="flex justify-between">
                        <span>Tracking Number:</span>
                        <span className="font-mono font-semibold text-foreground">
                          {selectedOrder.tracking.trackingNumber}
                        </span>
                      </div>
                    )}
                    {selectedOrder.tracking?.trackingUrl && (
                      <a
                        href={selectedOrder.tracking.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-[11px] pt-1"
                      >
                        <span>Open Courier Portal</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Ledger */}
              <div className="rounded-2xl border border-border/70 p-4 space-y-2 text-xs bg-muted/20">
                <div className="flex justify-between text-muted-foreground">
                  <span>Garment Subtotal</span>
                  <span className="font-medium text-foreground tabular-nums">${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Discount Privilege</span>
                    <span className="tabular-nums">-${selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Courier Dispatch</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {selectedOrder.shippingCost === 0 ? "Complimentary" : `$${selectedOrder.shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Tax</span>
                  <span className="font-medium text-foreground tabular-nums">${selectedOrder.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-sm text-foreground pt-1">
                  <span>Total Authorized</span>
                  <span className="text-base font-mono tabular-nums">${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Status History & Audit Log */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>State Machine Transition Audit Trail</span>
                </h4>
                <div className="rounded-2xl border border-border/70 p-4 space-y-3 text-xs">
                  {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                    selectedOrder.statusHistory.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 border-b border-border/40 pb-2.5 last:border-b-0 last:pb-0">
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
                            <p className="text-[11px] text-muted-foreground italic">&ldquo;{step.reason}&rdquo;</p>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            Actor: {step.changedBy || "System"} ({step.role || "admin"})
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Initial pending state logged.</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 2. UPDATE STATUS TRANSITION MODAL */}
      {orderToUpdate && (
        <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>Transition Order // {orderToUpdate.orderNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Current Status: <strong className="uppercase">{orderToUpdate.status}</strong>. Only validated state transitions are permitted.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveStatus} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="nextStatus" className="text-xs font-semibold">
                  Select Target State <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={newStatus}
                  onValueChange={(val) => setNewStatus(val as OrderStatus)}
                >
                  <SelectTrigger id="nextStatus" className="h-10 rounded-xl text-xs">
                    <SelectValue placeholder="Choose allowed transition" />
                  </SelectTrigger>
                  <SelectContent>
                    {(VALID_STATUS_TRANSITIONS[orderToUpdate.status] || []).map((st) => (
                      <SelectItem key={st} value={st} className="text-xs capitalize">
                        {st.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Tracking Fields when transitioning to Shipped */}
              {newStatus === "shipped" && (
                <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs">
                  <span className="font-bold text-foreground block">Dispatch Telemetry</span>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Courier Carrier</Label>
                    <Input
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="e.g. Bluedart, Delhivery, DHL"
                      className="h-8 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Tracking AWB / Number</Label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. BD77192038"
                      className="h-8 rounded-lg text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Tracking Portal URL</Label>
                    <Input
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://track.courier.com?awb=..."
                      className="h-8 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Reason / Audit Note */}
              <div className="space-y-1.5">
                <Label htmlFor="statusReason" className="text-xs font-semibold">
                  Transition Audit Note / Reason
                </Label>
                <Input
                  id="statusReason"
                  placeholder="e.g., Fabric crafted, parcel packaged for transit"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateStatusMutation.isPending || !newStatus}
                  className="rounded-xl text-xs font-semibold"
                >
                  {updateStatusMutation.isPending ? "Executing Transition..." : "Commit State Change"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
}
