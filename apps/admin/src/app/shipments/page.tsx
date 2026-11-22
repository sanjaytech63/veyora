/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { adminShippingApi } from "@/lib/api/admin-shipping-api";
import { adminOrdersApi } from "@/lib/api/admin-orders-api";
import {
  ShipmentDto,
  ShipmentStatus,
  CarrierType,
  CreateShipmentPayload,
  UpdateShipmentTrackingPayload,
} from "@veyora/types";
import {
  Search,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MapPin,
  Copy,
  Plus,
  Send,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";

const SHIPMENT_STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  pending: {
    label: "Awaiting Dispatch",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  manifested: {
    label: "Manifested",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Sparkles,
  },
  picked_up: {
    label: "Picked Up by Carrier",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    icon: Package,
  },
  in_transit: {
    label: "In Transit",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    icon: Truck,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    icon: MapPin,
  },
  delivered: {
    label: "Delivered",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  failed_delivery: {
    label: "Delivery Failed",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: AlertTriangle,
  },
  returned: {
    label: "Returned to Atelier",
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    icon: RotateCcw,
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    icon: XCircle,
  },
};

const CARRIERS: { value: CarrierType; label: string }[] = [
  { value: "delhivery", label: "Delhivery Express" },
  { value: "shiprocket", label: "Shiprocket Air" },
  { value: "bluedart", label: "Blue Dart Apex" },
  { value: "fedex", label: "FedEx Priority" },
  { value: "custom", label: "White-Glove Valet" },
];

export default function AdminShipmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [carrierFilter, setCarrierFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  // Modals state
  const [selectedShipment, setSelectedShipment] = React.useState<ShipmentDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Create form state
  const [orderIdInput, setOrderIdInput] = React.useState("");
  const [selectedCarrier, setSelectedCarrier] = React.useState<string>("delhivery");
  const [shippingMethodInput, setShippingMethodInput] = React.useState<string>("standard");
  const [customAwbInput, setCustomAwbInput] = React.useState("");
  const [fulfillmentNotes, setFulfillmentNotes] = React.useState("");

  // Update tracking state
  const [newStatus, setNewStatus] = React.useState<ShipmentStatus>("in_transit");
  const [newLocation, setNewLocation] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");

  // Fetch Shipments
  const {
    data: shipmentsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-shipments", page, search, carrierFilter, statusFilter],
    queryFn: () =>
      adminShippingApi.listShipments({
        page,
        limit: 15,
        search: search.trim() || undefined,
        carrier: carrierFilter !== "all" ? carrierFilter : undefined,
        status: statusFilter !== "all" ? (statusFilter as ShipmentStatus) : undefined,
      }),
  });

  // Fetch pending/confirmed/processing orders for quick fulfillment
  const { data: unfulfilledOrdersData } = useQuery({
    queryKey: ["admin-unfulfilled-orders"],
    queryFn: () => adminOrdersApi.listOrders({ status: "processing", limit: 20 }),
  });

  // Create Shipment Mutation
  const createShipmentMutation = useMutation({
    mutationFn: (payload: CreateShipmentPayload) => adminShippingApi.createShipment(payload),
    onSuccess: (shipment) => {
      toast.success(
        `Shipment #${shipment.shipmentNumber} manifested! AWB: ${shipment.trackingNumber}`
      );
      queryClient.invalidateQueries({ queryKey: ["admin-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setIsCreateOpen(false);
      setOrderIdInput("");
      setCustomAwbInput("");
      setFulfillmentNotes("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create shipment");
    },
  });

  // Update Tracking Mutation
  const updateTrackingMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateShipmentTrackingPayload }) =>
      adminShippingApi.updateTracking(id, payload),
    onSuccess: (updatedShipment) => {
      toast.success(`Shipment tracking updated to '${updatedShipment.status}'`);
      setSelectedShipment(updatedShipment);
      queryClient.invalidateQueries({ queryKey: ["admin-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setNewLocation("");
      setNewDescription("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update tracking");
    },
  });

  const shipments = shipmentsData?.data || [];
  const pagination = shipmentsData?.pagination || { total: 0, pages: 1, page: 1 };

  // Calculate Metrics
  const totalCount = pagination.total || shipments.length;
  const inTransitCount = shipments.filter((s) => s.status === "in_transit").length;
  const outForDeliveryCount = shipments.filter((s) => s.status === "out_for_delivery").length;
  const deliveredCount = shipments.filter((s) => s.status === "delivered").length;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim()) {
      toast.error("Please provide a valid Order ID");
      return;
    }

    createShipmentMutation.mutate({
      orderId: orderIdInput.trim(),
      carrier: selectedCarrier,
      shippingMethod: shippingMethodInput,
      trackingNumber: customAwbInput.trim() || undefined,
      notes: fulfillmentNotes.trim() || undefined,
    });
  };

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    updateTrackingMutation.mutate({
      id: selectedShipment.id,
      payload: {
        status: newStatus,
        location: newLocation.trim() || undefined,
        description: newDescription.trim() || undefined,
      },
    });
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 p-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-semibold tracking-tight">
              Shipments & Fulfillment
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fulfill couture orders, manage carrier manifests, and track parcels across Indian and
              global logistics hubs.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Fulfill Order
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-medium">
              <Boxes className="h-4 w-4" />
              Total Shipments
            </div>
            <div className="text-2xl font-bold mt-2">{totalCount}</div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs uppercase tracking-wider font-medium">
              <Truck className="h-4 w-4" />
              In Transit
            </div>
            <div className="text-2xl font-bold mt-2">{inTransitCount}</div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs uppercase tracking-wider font-medium">
              <MapPin className="h-4 w-4" />
              Out for Delivery
            </div>
            <div className="text-2xl font-bold mt-2">{outForDeliveryCount}</div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Delivered
            </div>
            <div className="text-2xl font-bold mt-2">{deliveredCount}</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card p-4 rounded-xl border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search AWB, shipment #, order # or client name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={carrierFilter}
              onValueChange={(val) => {
                setCarrierFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Carriers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="delhivery">Delhivery</SelectItem>
                <SelectItem value="shiprocket">Shiprocket</SelectItem>
                <SelectItem value="bluedart">Blue Dart</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="custom">White-Glove</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="manifested">Manifested</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold">Shipment & Order</TableHead>
                <TableHead className="font-semibold">Carrier / Method</TableHead>
                <TableHead className="font-semibold">AWB Tracking</TableHead>
                <TableHead className="font-semibold">Destination</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Dispatched</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Loading atelier shipments...
                  </TableCell>
                </TableRow>
              ) : shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No shipments found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map((shipment) => {
                  const statusMeta = SHIPMENT_STATUS_CONFIG[shipment.status] || {
                    label: shipment.status,
                    badgeClass: "bg-gray-500/10 text-gray-500 border-gray-500/20",
                    icon: Package,
                  };
                  const StatusIcon = statusMeta.icon;

                  return (
                    <TableRow key={shipment.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {shipment.shipmentNumber}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            Order #{shipment.orderNumber}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{shipment.carrierName}</span>
                          <span className="text-[11px] text-muted-foreground capitalize">
                            {shipment.shippingMethod}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span>{shipment.trackingNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(shipment.trackingNumber, "AWB")}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy AWB"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">
                            {shipment.shippingAddress.firstName} {shipment.shippingAddress.lastName}
                          </span>
                          <span className="text-muted-foreground">
                            {shipment.shippingAddress.city}, {shipment.shippingAddress.state}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${statusMeta.badgeClass}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusMeta.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {shipment.shippedAt
                          ? new Date(shipment.shippedAt).toLocaleDateString()
                          : "—"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedShipment(shipment);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 text-xs gap-1"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          Track & Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 text-xs">
              <span className="text-muted-foreground">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} shipments)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: SHIPMENT DETAILS & TRACKING PROGRESSION */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedShipment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between pr-4 font-serif text-xl">
                  <span>Shipment {selectedShipment.shipmentNumber}</span>
                  <Badge
                    variant="outline"
                    className={SHIPMENT_STATUS_CONFIG[selectedShipment.status]?.badgeClass || ""}
                  >
                    {SHIPMENT_STATUS_CONFIG[selectedShipment.status]?.label ||
                      selectedShipment.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Linked to Order #{selectedShipment.orderNumber} • Handled by{" "}
                  {selectedShipment.carrierName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                {/* Meta details banner */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40 text-xs">
                  <div>
                    <span className="text-muted-foreground block">AWB Tracking #</span>
                    <span className="font-mono font-semibold text-foreground flex items-center gap-1 mt-0.5">
                      {selectedShipment.trackingNumber}
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedShipment.trackingNumber, "AWB")}
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Delivery Tier</span>
                    <span className="font-medium capitalize text-foreground mt-0.5 block">
                      {selectedShipment.shippingMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Est. Delivery</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {selectedShipment.estimatedDeliveryAt
                        ? new Date(selectedShipment.estimatedDeliveryAt).toLocaleDateString()
                        : "2-4 Business Days"}
                    </span>
                  </div>
                </div>

                {/* Destination Address */}
                <div className="text-xs">
                  <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Delivery Destination
                  </h4>
                  <p className="text-muted-foreground">
                    {selectedShipment.shippingAddress.firstName}{" "}
                    {selectedShipment.shippingAddress.lastName}
                    <br />
                    {selectedShipment.shippingAddress.street}
                    {selectedShipment.shippingAddress.apartment &&
                      `, ${selectedShipment.shippingAddress.apartment}`}
                    <br />
                    {selectedShipment.shippingAddress.city},{" "}
                    {selectedShipment.shippingAddress.state} -{" "}
                    {selectedShipment.shippingAddress.postalCode}
                    <br />
                    {selectedShipment.shippingAddress.country}
                    {selectedShipment.shippingAddress.phone &&
                      ` • Phone: ${selectedShipment.shippingAddress.phone}`}
                  </p>
                </div>

                {/* Package Items */}
                <div className="text-xs">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    Package Items ({selectedShipment.items.length})
                  </h4>
                  <div className="rounded-lg border divide-y bg-background">
                    {selectedShipment.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            SKU: {item.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">Qty: {item.quantity}</span>
                          <span className="text-muted-foreground block text-[11px]">
                            ₹{item.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Visual Tracking Events Timeline */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Carrier Tracking Timeline
                  </h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {selectedShipment.trackingEvents.map((event, idx) => (
                      <div key={idx} className="relative flex items-start gap-3 text-xs">
                        <span className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold capitalize text-foreground">
                              {event.status.replace("_", " ")}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-0.5">{event.description}</p>
                          {event.location && (
                            <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Advance Tracking Status Form */}
                <form
                  onSubmit={handleTrackingSubmit}
                  className="space-y-3 bg-muted/20 p-4 rounded-xl border"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Update Shipment Status
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Next Status</Label>
                      <Select
                        value={newStatus}
                        onValueChange={(val) => setNewStatus(val as ShipmentStatus)}
                      >
                        <SelectTrigger className="mt-1 h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="picked_up">Picked Up</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="failed_delivery">Failed Delivery</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Location / Transit Hub</Label>
                      <Input
                        placeholder="e.g. Mumbai Gateway Hub"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Timeline Note</Label>
                    <Input
                      placeholder="e.g. Sorted at regional logistics facility"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateTrackingMutation.isPending}
                      className="gap-1.5 text-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {updateTrackingMutation.isPending ? "Updating..." : "Post Tracking Event"}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: FULFILL ORDER & MANIFEST SHIPMENT */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Fulfill Order</DialogTitle>
            <DialogDescription>
              Generate an Airway Bill (AWB) and dispatch an atelier package through your connected
              courier network.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-medium">Select Unfulfilled Order</Label>
              {unfulfilledOrdersData &&
              unfulfilledOrdersData.items &&
              unfulfilledOrdersData.items.length > 0 ? (
                <Select value={orderIdInput} onValueChange={(val) => setOrderIdInput(val)}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue placeholder="Select an order awaiting fulfillment" />
                  </SelectTrigger>
                  <SelectContent>
                    {unfulfilledOrdersData.items.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        #{o.orderNumber} — {o.customerName} (₹{o.total.toLocaleString("en-IN")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Paste Order ID (MongoDB ObjectId)"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  className="mt-1 text-xs font-mono"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Carrier</Label>
                <Select value={selectedCarrier} onValueChange={(val) => setSelectedCarrier(val)}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium">Shipping Tier</Label>
                <Select
                  value={shippingMethodInput}
                  onValueChange={(val) => setShippingMethodInput(val)}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Courier</SelectItem>
                    <SelectItem value="express">Express Priority Air</SelectItem>
                    <SelectItem value="white_glove">White-Glove Valet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Custom AWB / Waybill # (Optional)</Label>
              <Input
                placeholder="Leave blank to auto-generate from provider"
                value={customAwbInput}
                onChange={(e) => setCustomAwbInput(e.target.value)}
                className="mt-1 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Fulfillment Notes</Label>
              <Input
                placeholder="e.g. Inspected by Head Tailor. Signature ribbon applied."
                value={fulfillmentNotes}
                onChange={(e) => setFulfillmentNotes(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createShipmentMutation.isPending}
                className="gap-1.5"
              >
                <Truck className="h-3.5 w-3.5" />
                {createShipmentMutation.isPending ? "Manifesting..." : "Manifest & Fulfill"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
