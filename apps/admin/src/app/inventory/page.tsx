"use client";

import * as React from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminInventoryApi } from "@/lib/api/admin-inventory-api";
import { InventoryItem, InventoryStats } from "@veyora/types";
import { AdjustStockInput } from "@veyora/validators";
import { toast } from "sonner";
import {
  Boxes,
  Package,
  Search,
  RefreshCw,
  SlidersHorizontal,
  History,
  AlertTriangle,
  XCircle,
  Lock,
} from "lucide-react";

export default function AdminInventoryPage() {
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [stats, setStats] = React.useState<InventoryStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Adjustment Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null);
  const [adjType, setAdjType] = React.useState<"increase" | "decrease" | "correction">("increase");
  const [adjQuantity, setAdjQuantity] = React.useState<number | "">("");
  const [adjReason, setAdjReason] = React.useState("");
  const [adjNote, setAdjNote] = React.useState("");
  const [adjReferenceId, setAdjReferenceId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const loadInventory = React.useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, statRes] = await Promise.allSettled([
        adminInventoryApi.getInventory({ limit: 100 }),
        adminInventoryApi.getStats(),
      ]);

      if (invRes.status === "fulfilled") {
        setItems(invRes.value);
      }
      if (statRes.status === "fulfilled") {
        setStats(statRes.value);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjType("increase");
    setAdjQuantity("");
    setAdjReason("");
    setAdjNote("");
    setAdjReferenceId("");
    setDialogOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (typeof adjQuantity !== "number" || adjQuantity < 0) {
      toast.error("Valid adjustment quantity is required.");
      return;
    }
    if (!adjReason.trim()) {
      toast.error("Adjustment reason is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: AdjustStockInput = {
        sku: selectedItem.sku,
        type: adjType,
        quantity: adjQuantity,
        reason: adjReason.trim(),
        note: adjNote.trim() || undefined,
        referenceId: adjReferenceId.trim() || undefined,
      };

      await adminInventoryApi.adjustStock(payload);
      toast.success(`Inventory updated for SKU ${selectedItem.sku}`);
      setDialogOpen(false);
      loadInventory();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust stock.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        search === "" ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.productTitle.toLowerCase().includes(search.toLowerCase()) ||
        (item.variantName && item.variantName.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  return (
    <PageContainer
      title="Inventory Management"
      description="Track stock levels, record movement audits, manage threshold alerts, and control reservations."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={loadInventory}
          disabled={loading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {/* 1. Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked SKUs</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTrackedItems ?? items.length}</div>
            <p className="text-xs text-muted-foreground">Catalog item units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total On-Hand</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.totalUnitsOnHand ?? items.reduce((acc, i) => acc + i.onHand, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Physical warehouse units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved Units</CardTitle>
            <Lock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.totalUnitsReserved ?? items.reduce((acc, i) => acc + i.reserved, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Active carts & pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.lowStockCount ?? items.filter((i) => i.status === "low_stock").length}
            </div>
            <p className="text-xs text-muted-foreground">At or below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.outOfStockCount ?? items.filter((i) => i.status === "out_of_stock").length}
            </div>
            <p className="text-xs text-muted-foreground">0 available units</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Search & Status Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory by SKU, product name, or variant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by Inventory Status"
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Inventory Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock Alerts</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    SKU & Product
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    On Hand
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    Reserved
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    Available
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    Threshold
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="h-24 text-center text-muted-foreground">
                      Loading inventory records...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Boxes className="h-8 w-8 text-muted-foreground/40" />
                        <p className="font-medium">No inventory records found</p>
                        <p className="text-xs">
                          Inventory records are created when catalog products and variants are added.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {item.sku}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {item.productTitle}
                          </span>
                          {item.variantName && (
                            <span className="text-xs text-muted-foreground">
                              Variant: {item.variantName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle text-center font-bold text-base">
                        {item.onHand}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {item.reserved > 0 ? (
                          <span className="font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded text-xs">
                            {item.reserved}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">0</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center font-extrabold text-base text-foreground">
                        {item.available}
                      </td>
                      <td className="p-4 align-middle text-center text-muted-foreground text-xs">
                        {item.lowStockThreshold}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge
                          variant={
                            item.status === "in_stock"
                              ? "default"
                              : item.status === "low_stock"
                              ? "secondary"
                              : "destructive"
                          }
                          className={
                            item.status === "in_stock"
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : item.status === "low_stock"
                              ? "bg-amber-500 text-white hover:bg-amber-600"
                              : ""
                          }
                        >
                          {item.status === "in_stock"
                            ? "In Stock"
                            : item.status === "low_stock"
                            ? "Low Stock"
                            : "Out of Stock"}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs flex items-center gap-1"
                            onClick={() => handleOpenAdjust(item)}
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Adjust
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 text-xs flex items-center gap-1 text-muted-foreground"
                          >
                            <Link href={`/inventory/${item.sku}`}>
                              <History className="h-3.5 w-3.5" />
                              Audit Ledger
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Stock Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Inventory Stock</DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  Adjusting SKU: <strong className="font-mono">{selectedItem.sku}</strong> (
                  {selectedItem.productTitle})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="rounded-lg border bg-muted/20 p-3 text-xs grid grid-cols-3 gap-2 text-center mb-2">
              <div>
                <span className="text-muted-foreground block">On Hand</span>
                <span className="font-bold text-sm">{selectedItem.onHand}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Reserved</span>
                <span className="font-bold text-sm text-amber-600">{selectedItem.reserved}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Available</span>
                <span className="font-bold text-sm text-emerald-600">{selectedItem.available}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Operation Type</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as "increase" | "decrease" | "correction")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="increase">Restock / Add Stock (+ Units)</option>
                <option value="decrease">Write-off / Damage / Remove (- Units)</option>
                <option value="correction">Physical Count Correction (Set Absolute Total)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {adjType === "correction" ? "New Total Count *" : "Quantity Delta *"}
              </label>
              <Input
                type="number"
                min={0}
                required
                placeholder="e.g. 25"
                value={adjQuantity}
                onChange={(e) =>
                  setAdjQuantity(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason *</label>
              <Input
                required
                placeholder="e.g. PO-9812 shipment received, damaged in warehouse, audit reconciliation"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference ID</label>
                <Input
                  placeholder="e.g. PO-1029, RETURN-44"
                  value={adjReferenceId}
                  onChange={(e) => setAdjReferenceId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Internal Note</label>
                <Input
                  placeholder="Optional note"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving Adjustment..." : "Apply Adjustment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
