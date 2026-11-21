"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { title: string; size: string; color: string; quantity: number; price: number }[];
  total: number;
  paymentStatus: "paid" | "pending";
  fulfillmentStatus: "delivered" | "processing" | "shipped" | "cancelled";
  address: string;
  date: string;
}

const INITIAL_ORDERS: Order[] = [
  {
    id: "VY-ORD-928412",
    customerName: "Aishwarya Sharma",
    customerEmail: "aishwarya.s@gmail.com",
    items: [
      {
        title: "Chanderi Silk Kurti Set with Organza Dupatta",
        size: "M",
        color: "Crimson Red",
        quantity: 1,
        price: 185.0,
      },
    ],
    total: 185.0,
    paymentStatus: "paid",
    fulfillmentStatus: "processing",
    address: "B-42 Civil Lines, Jaipur, Rajasthan 302006",
    date: "15 mins ago",
  },
  {
    id: "VY-ORD-881290",
    customerName: "Pooja Mehta",
    customerEmail: "pooja.mehta@yahoo.com",
    items: [
      {
        title: "Bandhani Silk Festive Lehenga Choli",
        size: "S",
        color: "Mustard Haldi",
        quantity: 1,
        price: 495.0,
      },
    ],
    total: 495.0,
    paymentStatus: "paid",
    fulfillmentStatus: "shipped",
    address: "Flat 804, Sea Green Apts, Worli, Mumbai 400018",
    date: "1 hour ago",
  },
  {
    id: "VY-ORD-740192",
    customerName: "Rohan Varma",
    customerEmail: "rohan.varma@outlook.com",
    items: [
      {
        title: "Pure Mulmul Cotton Hand-Block Print Kurti",
        size: "L",
        color: "Indigo Blue",
        quantity: 1,
        price: 68.0,
      },
    ],
    total: 68.0,
    paymentStatus: "paid",
    fulfillmentStatus: "delivered",
    address: "Villa 12, Indiranagar, Bengaluru, Karnataka 560038",
    date: "3 hours ago",
  },
  {
    id: "VY-ORD-651902",
    customerName: "Sneha Kapur",
    customerEmail: "sneha.k@hotmail.com",
    items: [
      {
        title: "Regal Banarasi Katan Silk Brocade Zari Saree",
        size: "Free Size",
        color: "Royal Emerald",
        quantity: 1,
        price: 380.0,
      },
    ],
    total: 380.0,
    paymentStatus: "paid",
    fulfillmentStatus: "processing",
    address: "74 Golf Links, New Delhi 110003",
    date: "5 hours ago",
  },
  {
    id: "VY-ORD-519201",
    customerName: "Meera Patel",
    customerEmail: "meera.patel@gmail.com",
    items: [
      {
        title: "Artisanal Pure Linen Relaxed Co-ord Set",
        size: "M",
        color: "Oatmeal Beige",
        quantity: 1,
        price: 145.0,
      },
    ],
    total: 145.0,
    paymentStatus: "paid",
    fulfillmentStatus: "shipped",
    address: "24 Navrangpura, Ahmedabad, Gujarat 380009",
    date: "Yesterday",
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>(INITIAL_ORDERS);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  const filteredOrders = React.useMemo(() => {
    return orders.filter((ord) => {
      const matchQuery =
        search === "" ||
        ord.id.toLowerCase().includes(search.toLowerCase()) ||
        ord.customerName.toLowerCase().includes(search.toLowerCase()) ||
        ord.customerEmail.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || ord.fulfillmentStatus === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const updateOrderStatus = (orderId: string, newStatus: Order["fulfillmentStatus"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, fulfillmentStatus: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, fulfillmentStatus: newStatus } : null));
    }
    toast.success(`Order ${orderId} updated to ${newStatus}`);
  };

  return (
    <PageContainer
      title="Orders & Shipments"
      description="Track customer orders, manage fulfillment workflows, and review shipment telemetry."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Orders Refreshed")}
          className="gap-1.5 rounded-xl text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      }
    >
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 mb-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer name, or email..."
            className="pl-10 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground">Fulfillment:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] rounded-xl text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Garments</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No orders found matching the filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((ord) => (
                <TableRow key={ord.id}>
                  <TableCell className="font-mono font-bold text-primary">{ord.id}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{ord.customerName}</div>
                    <div className="text-[10px] text-muted-foreground">{ord.customerEmail}</div>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate">
                    {ord.items.map((i) => `${i.title} (${i.size})`).join(", ")}
                  </TableCell>
                  <TableCell className="font-bold tabular-nums">${ord.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold text-emerald-600 border-emerald-500/30">
                      Paid
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ord.fulfillmentStatus === "delivered"
                          ? "default"
                          : ord.fulfillmentStatus === "shipped"
                          ? "secondary"
                          : "outline"
                      }
                      className="rounded-full px-2.5 py-0.5 text-[10px] capitalize font-semibold"
                    >
                      {ord.fulfillmentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[11px]">{ord.date}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(ord)}
                      className="h-8 rounded-lg text-xs gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-lg rounded-3xl p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center justify-between">
                <span>Order Details</span>
                <span className="font-mono text-xs text-primary">{selectedOrder.id}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Placed on {selectedOrder.date} by {selectedOrder.customerName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <span className="font-bold text-foreground">Delivery Destination:</span>
                <p className="text-muted-foreground">{selectedOrder.address}</p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-foreground">Garments in Order:</span>
                <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-3">
                      <div>
                        <div className="font-semibold text-foreground">{item.title}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Color: {item.color} • Size: {item.size} • Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="font-bold tabular-nums">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border/60 text-sm font-bold">
                <span>Total Settlement:</span>
                <span className="text-base tabular-nums">${selectedOrder.total.toFixed(2)}</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <span className="font-bold text-foreground block">Update Fulfillment State:</span>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={selectedOrder.fulfillmentStatus === "processing" ? "default" : "outline"}
                    onClick={() => updateOrderStatus(selectedOrder.id, "processing")}
                    className="rounded-xl text-xs"
                  >
                    Processing
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.fulfillmentStatus === "shipped" ? "default" : "outline"}
                    onClick={() => updateOrderStatus(selectedOrder.id, "shipped")}
                    className="rounded-xl text-xs"
                  >
                    Shipped
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.fulfillmentStatus === "delivered" ? "default" : "outline"}
                    onClick={() => updateOrderStatus(selectedOrder.id, "delivered")}
                    className="rounded-xl text-xs"
                  >
                    Delivered
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
}
