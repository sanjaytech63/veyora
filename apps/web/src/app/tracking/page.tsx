"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { shippingApi } from "@/lib/api/shipping-api";
import { ShipmentDto, ShipmentStatus } from "@veyora/types";
import {
  Search,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<
  ShipmentStatus,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  pending: {
    label: "Awaiting Dispatch",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Clock,
  },
  manifested: {
    label: "Manifest Created",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: Package,
  },
  picked_up: {
    label: "Picked Up by Courier",
    badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    icon: Package,
  },
  in_transit: {
    label: "In Transit",
    badgeClass: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    icon: Truck,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: MapPin,
  },
  delivered: {
    label: "Delivered",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: CheckCircle2,
  },
  failed_delivery: {
    label: "Delivery Attempt Failed",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    icon: AlertCircle,
  },
  returned: {
    label: "Returned to Atelier",
    badgeClass: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Shipment Cancelled",
    badgeClass: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    icon: AlertCircle,
  },
};

export default function TrackingPage() {
  const [queryInput, setQueryInput] = React.useState("");
  const [activeTrackingNumber, setActiveTrackingNumber] = React.useState("");

  const {
    data: shipment,
    isLoading,
    isError,
  } = useQuery<ShipmentDto>({
    queryKey: ["public-tracking", activeTrackingNumber],
    queryFn: () => shippingApi.trackShipment(activeTrackingNumber),
    enabled: Boolean(activeTrackingNumber.trim()),
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) {
      toast.error("Please enter a tracking number or shipment ID");
      return;
    }
    setActiveTrackingNumber(queryInput.trim());
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("AWB copied to clipboard");
  };

  const statusMeta = shipment
    ? STATUS_MAP[shipment.status] || {
        label: shipment.status,
        badgeClass: "bg-gray-500/10 text-gray-500 border-gray-500/20",
        icon: Package,
      }
    : null;

  return (
    <Container className="py-12 max-w-4xl space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-xs uppercase tracking-widest px-3 py-1">
          Atelier Logistics Telemetry
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-foreground">
          Track Your Delivery
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Enter your Airway Bill (AWB) or Shipment Number to view real-time transit updates from our
          courier partners.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="e.g. VEY-DELHIVERY-12345678 or SHP-2026-..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="pl-10 h-12 text-sm font-mono rounded-xl bg-card border-border/80"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 px-6 rounded-xl font-medium gap-2">
          <Truck className="h-4 w-4" />
          <span>Track</span>
        </Button>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 rounded-3xl border border-border/60 bg-card">
          <Truck className="h-8 w-8 animate-bounce mx-auto text-primary mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            Contacting logistics gateways...
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-10 px-6 rounded-3xl border border-destructive/20 bg-destructive/5 space-y-2 max-w-xl mx-auto">
          <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
          <p className="text-sm font-semibold text-foreground">No Shipment Found</p>
          <p className="text-xs text-muted-foreground">
            We could not locate any active shipment with identifier &ldquo;{activeTrackingNumber}
            &rdquo;. Please verify your AWB tracking number or contact our concierge.
          </p>
        </div>
      )}

      {/* Active Shipment Display */}
      {shipment && statusMeta && (
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
            <div>
              <span className="text-xs text-muted-foreground font-mono block">
                Shipment #{shipment.shipmentNumber} • Order #{shipment.orderNumber}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-lg font-bold text-foreground">
                  {shipment.trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(shipment.trackingNumber)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Copy AWB"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-xs px-3 py-1.5 flex items-center gap-1.5 font-medium ${statusMeta.badgeClass}`}
            >
              <statusMeta.icon className="h-4 w-4" />
              {statusMeta.label}
            </Badge>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">Carrier Partner</span>
              <span className="font-semibold text-foreground block mt-0.5">
                {shipment.carrierName}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">Delivery Tier</span>
              <span className="font-semibold text-foreground capitalize block mt-0.5">
                {shipment.shippingMethod} Courier
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">Dispatched Date</span>
              <span className="font-semibold text-foreground block mt-0.5">
                {shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleDateString() : "Pending"}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">Estimated Arrival</span>
              <span className="font-semibold text-primary block mt-0.5">
                {shipment.estimatedDeliveryAt
                  ? new Date(shipment.estimatedDeliveryAt).toLocaleDateString()
                  : "2-4 Business Days"}
              </span>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Real-Time Tracking Events
            </h3>
            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {shipment.trackingEvents.map((event, idx) => (
                <div key={idx} className="relative flex items-start gap-3 text-xs">
                  <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-card" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground capitalize">
                        {event.status.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{event.description}</p>
                    {event.location && (
                      <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5 mb-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Destination</span>
            </span>
            <p className="text-muted-foreground">
              {shipment.shippingAddress.city}, {shipment.shippingAddress.state}{" "}
              {shipment.shippingAddress.postalCode}, {shipment.shippingAddress.country}
            </p>
          </div>
        </div>
      )}
    </Container>
  );
}
