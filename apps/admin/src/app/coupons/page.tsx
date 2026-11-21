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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  amount: number;
  minSpend: number;
  expiry: string;
  usageCount: number;
  status: "active" | "expired";
}

const INITIAL_COUPONS: Coupon[] = [
  {
    id: "CPN-01",
    code: "ATELIER10",
    discountType: "percentage",
    amount: 10,
    minSpend: 100,
    expiry: "Dec 31, 2026",
    usageCount: 142,
    status: "active",
  },
  {
    id: "CPN-02",
    code: "FESTIVE50",
    discountType: "fixed",
    amount: 50,
    minSpend: 300,
    expiry: "Nov 30, 2026",
    usageCount: 68,
    status: "active",
  },
  {
    id: "CPN-03",
    code: "FIRSTORDER",
    discountType: "percentage",
    amount: 15,
    minSpend: 75,
    expiry: "Permanent",
    usageCount: 289,
    status: "active",
  },
];

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = React.useState<Coupon[]>(INITIAL_COUPONS);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [amount, setAmount] = React.useState<number>(10);
  const [minSpend, setMinSpend] = React.useState<number>(100);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCoupon: Coupon = {
      id: `CPN-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountType: "percentage",
      amount,
      minSpend,
      expiry: "Dec 31, 2026",
      usageCount: 0,
      status: "active",
    };

    setCoupons((prev) => [newCoupon, ...prev]);
    toast.success("Coupon Created", { description: `Code ${newCoupon.code} is now live.` });
    setDialogOpen(false);
    setCode("");
  };

  const handleDelete = (id: string, code: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    toast.info(`Coupon ${code} deleted.`);
  };

  return (
    <PageContainer
      title="Coupons &amp; Promotions"
      description="Manage promotional codes, privilege discounts, and seasonal campaign incentives."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Coupons Refreshed")}
            className="gap-1.5 rounded-xl text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-xl text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" />
                New Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Create Promo Code</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Generate a discount code for customer checkout.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateCoupon} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Coupon Code</label>
                  <Input
                    required
                    placeholder="e.g. DIWALI20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Discount (%)</label>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Min Spend ($)</label>
                    <Input
                      type="number"
                      min={0}
                      value={minSpend}
                      onChange={(e) => setMinSpend(Number(e.target.value))}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full rounded-xl text-xs font-bold h-10 mt-2">
                  Activate Coupon
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-bold text-primary">{c.code}</TableCell>
                <TableCell className="font-semibold">{c.amount}% Off</TableCell>
                <TableCell className="tabular-nums">${c.minSpend}</TableCell>
                <TableCell className="tabular-nums">{c.usageCount} orders</TableCell>
                <TableCell className="text-muted-foreground">{c.expiry}</TableCell>
                <TableCell>
                  <Badge variant="default" className="text-[10px] uppercase font-semibold">
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(c.id, c.code)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${c.code}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
}
