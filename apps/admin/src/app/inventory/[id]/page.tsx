"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { InventoryItem, StockMovement } from "@veyora/types";
import { AdjustStockInput } from "@veyora/validators";
import { toast } from "sonner";
import {
  ArrowLeft,
  Boxes,
  Package,
  Lock,
  History,
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function InventoryDetailPage() {
  const params = useParams();
  const skuOrId = params?.id as string;

  const [item, setItem] = React.useState<InventoryItem | null>(null);
  const [movements, setMovements] = React.useState<StockMovement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [thresholdInput, setThresholdInput] = React.useState<number>(5);
  const [updatingThreshold, setUpdatingThreshold] = React.useState(false);

  // Quick Adjustment Dialog
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [adjType, setAdjType] = React.useState<"increase" | "decrease" | "correction">("increase");
  const [adjQuantity, setAdjQuantity] = React.useState<number | "">("");
  const [adjReason, setAdjReason] = React.useState("");
  const [adjNote, setAdjNote] = React.useState("");
  const [adjReferenceId, setAdjReferenceId] = React.useState("");
  const [submittingAdj, setSubmittingAdj] = React.useState(false);

  const loadData = React.useCallback(async () => {
    if (!skuOrId) return;
    setLoading(true);
    try {
      const [itemData, movementsData] = await Promise.all([
        adminInventoryApi.getItem(skuOrId),
        adminInventoryApi.getMovements(skuOrId, 1, 50),
      ]);

      setItem(itemData);
      setThresholdInput(itemData.lowStockThreshold);
      setMovements(movementsData);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load inventory details.");
    } finally {
      setLoading(false);
    }
  }, [skuOrId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setUpdatingThreshold(true);
    try {
      const updated = await adminInventoryApi.updateThreshold(item.sku, {
        lowStockThreshold: thresholdInput,
      });
      setItem(updated);
      toast.success("Low stock threshold updated successfully.");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update threshold.");
    } finally {
      setUpdatingThreshold(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (typeof adjQuantity !== "number" || adjQuantity < 0) {
      toast.error("Valid adjustment quantity is required.");
      return;
    }
    if (!adjReason.trim()) {
      toast.error("Adjustment reason is required.");
      return;
    }

    setSubmittingAdj(true);
    try {
      const payload: AdjustStockInput = {
        sku: item.sku,
        type: adjType,
        quantity: adjQuantity,
        reason: adjReason.trim(),
        note: adjNote.trim() || undefined,
        referenceId: adjReferenceId.trim() || undefined,
      };

      await adminInventoryApi.adjustStock(payload);
      toast.success("Stock adjustment recorded in audit ledger.");
      setDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust stock.");
    } finally {
      setSubmittingAdj(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Loading Inventory Ledger..." description="Please wait...">
        <div className="p-12 text-center text-muted-foreground animate-pulse">
          Fetching item stock balances and movement audit trail...
        </div>
      </PageContainer>
    );
  }

  if (!item) {
    return (
      <PageContainer title="Inventory Item Not Found" description="The requested item could not be found.">
        <div className="p-12 text-center space-y-4">
          <Boxes className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No inventory record found for &quot;{skuOrId}&quot;.</p>
          <Button asChild>
            <Link href="/inventory">Return to Inventory</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Inventory: ${item.sku}`}
      description={`${item.productTitle}${item.variantName ? ` • Variant: ${item.variantName}` : ""}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/inventory" className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setAdjType("increase");
              setAdjQuantity("");
              setAdjReason("");
              setAdjNote("");
              setAdjReferenceId("");
              setDialogOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Adjust Stock
          </Button>
        </div>
      }
    >
      {/* 1. Stock Status Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Physical On-Hand</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{item.onHand}</div>
            <p className="text-xs text-muted-foreground">Total units in warehouse</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved</CardTitle>
            <Lock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-600">{item.reserved}</div>
            <p className="text-xs text-muted-foreground">Committed / active checkouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Sale</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">{item.available}</div>
            <p className="text-xs text-muted-foreground">On-hand minus reserved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status & Threshold</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
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
                    ? "bg-emerald-600 text-white"
                    : item.status === "low_stock"
                    ? "bg-amber-500 text-white"
                    : ""
                }
              >
                {item.status === "in_stock"
                  ? "In Stock"
                  : item.status === "low_stock"
                  ? "Low Stock"
                  : "Out of Stock"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Threshold alert at &le; {item.lowStockThreshold} units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Low Stock Threshold Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alert Threshold Configuration
          </CardTitle>
          <CardDescription>
            When available units reach or drop below this threshold, the item is flagged as Low Stock in reports and admin dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateThreshold} className="flex items-center gap-3 max-w-sm">
            <Input
              type="number"
              min={0}
              value={thresholdInput}
              onChange={(e) => setThresholdInput(parseInt(e.target.value, 10) || 0)}
              className="w-32"
            />
            <Button type="submit" variant="outline" size="sm" disabled={updatingThreshold}>
              {updatingThreshold ? "Updating..." : "Update Threshold"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Movement Audit History Ledger */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Stock Movement Audit Ledger
            </CardTitle>
            <CardDescription>
              Complete immutable ledger of all stock adjustments, purchase orders, count reconciliations, and reservations.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={loadData} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Ledger
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Date & Time
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Movement Type
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    Change
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    On-Hand Balance
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    Reserved Balance
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Reason & Reference
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Initiated By
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-28 text-center text-muted-foreground">
                      No stock movement history recorded for this SKU yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle text-xs text-muted-foreground font-mono">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline" className="capitalize text-xs">
                            {m.type.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-center font-bold">
                          <span
                            className={
                              isPositive
                                ? "text-emerald-600 inline-flex items-center"
                                : m.quantity < 0
                                ? "text-rose-600 inline-flex items-center"
                                : "text-muted-foreground"
                            }
                          >
                            {isPositive ? (
                              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                            ) : m.quantity < 0 ? (
                              <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5 mr-0.5" />
                            )}
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-center font-mono text-xs">
                          {m.previousOnHand} &rarr; <span className="font-bold">{m.newOnHand}</span>
                        </td>
                        <td className="p-4 align-middle text-center font-mono text-xs text-amber-600">
                          {m.previousReserved} &rarr; {m.newReserved}
                        </td>
                        <td className="p-4 align-middle">
                          <p className="font-medium text-foreground text-xs">{m.reason}</p>
                          {m.referenceId && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              Ref: {m.referenceId}
                            </span>
                          )}
                          {m.note && (
                            <p className="text-[11px] text-muted-foreground italic">{m.note}</p>
                          )}
                        </td>
                        <td className="p-4 align-middle text-xs text-muted-foreground">
                          {m.userName || "System"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock for {item.sku}</DialogTitle>
            <DialogDescription>
              Record an audit movement for {item.productTitle}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Operation</label>
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
                placeholder="e.g. 10"
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
                placeholder="e.g. Supplier PO receipt, physical cycle count, shipment damage"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference ID</label>
                <Input
                  placeholder="e.g. PO-771"
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
              <Button type="submit" disabled={submittingAdj}>
                {submittingAdj ? "Saving..." : "Apply Adjustment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
