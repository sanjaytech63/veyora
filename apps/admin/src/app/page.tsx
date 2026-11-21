"use client";

import * as React from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  ShoppingBag,
  Boxes,
  ArrowUpRight,
  Plus,
  RefreshCw,
  TrendingUp,
  Shirt,
} from "lucide-react";
import { toast } from "sonner";
import { SERVICES } from "@veyora/config";

interface RecentOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  items: string;
  total: number;
  paymentStatus: "paid" | "pending";
  fulfillmentStatus: "delivered" | "processing" | "shipped";
  date: string;
}

const SAMPLE_ORDERS: RecentOrder[] = [
  {
    id: "VY-ORD-928412",
    customerName: "Aishwarya Sharma",
    customerEmail: "aishwarya.s@gmail.com",
    items: "Chanderi Silk Kurti Set (M, Crimson)",
    total: 185.0,
    paymentStatus: "paid",
    fulfillmentStatus: "processing",
    date: "12 mins ago",
  },
  {
    id: "VY-ORD-881290",
    customerName: "Pooja Mehta",
    customerEmail: "pooja.mehta@yahoo.com",
    items: "Bandhani Silk Festive Lehenga Choli (S)",
    total: 495.0,
    paymentStatus: "paid",
    fulfillmentStatus: "shipped",
    date: "1 hour ago",
  },
  {
    id: "VY-ORD-740192",
    customerName: "Rohan Varma",
    customerEmail: "rohan.varma@outlook.com",
    items: "Mulmul Cotton Hand-Block Everyday Kurti (L)",
    total: 68.0,
    paymentStatus: "paid",
    fulfillmentStatus: "delivered",
    date: "3 hours ago",
  },
  {
    id: "VY-ORD-651902",
    customerName: "Sneha Kapur",
    customerEmail: "sneha.k@hotmail.com",
    items: "Regal Banarasi Katan Silk Brocade Saree",
    total: 380.0,
    paymentStatus: "paid",
    fulfillmentStatus: "processing",
    date: "5 hours ago",
  },
  {
    id: "VY-ORD-519201",
    customerName: "Meera Patel",
    customerEmail: "meera.patel@gmail.com",
    items: "Artisanal Pure Linen Relaxed Co-ord Set (M)",
    total: 145.0,
    paymentStatus: "paid",
    fulfillmentStatus: "shipped",
    date: "Yesterday",
  },
];

interface TopProduct {
  title: string;
  category: string;
  salesCount: number;
  revenue: number;
  inStock: number;
}

const TOP_PRODUCTS: TopProduct[] = [
  {
    title: "Chanderi Silk Kurti Set with Organza Dupatta",
    category: "Kurtis & Sets",
    salesCount: 84,
    revenue: 15540,
    inStock: 45,
  },
  {
    title: "Bandhani Silk Handcrafted Festive Lehenga Choli",
    category: "Ethnic Wear",
    salesCount: 42,
    revenue: 20790,
    inStock: 30,
  },
  {
    title: "Pure Mulmul Cotton Hand-Block Print Kurti",
    category: "Kurtis & Sets",
    salesCount: 120,
    revenue: 8160,
    inStock: 60,
  },
  {
    title: "Regal Banarasi Katan Silk Brocade Zari Saree",
    category: "Sarees & Drapes",
    salesCount: 28,
    revenue: 10640,
    inStock: 25,
  },
];

export default function AdminHomePage() {
  const [loading, setLoading] = React.useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Metrics Synchronized", {
        description: "Latest commerce and inventory data reloaded.",
      });
    }, 500);
  };

  return (
    <PageContainer
      title="Fashion Commerce Operations"
      description={`Executive operational dashboard and catalog management for ${SERVICES.NAME} Atelier.`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-1.5 rounded-xl text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync Metrics
          </Button>

          <Button asChild size="sm" className="gap-1.5 rounded-xl text-xs font-semibold">
            <Link href="/products/new">
              <Plus className="h-3.5 w-3.5" />
              Add Garment
            </Link>
          </Button>
        </div>
      }
    >
      {/* 1. Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Revenue
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight">$55,130.00</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+18.4% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight">316 Orders</div>
            <div className="mt-1 text-xs text-muted-foreground">
              <span>42 currently awaiting courier dispatch</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fashion Catalog
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Shirt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight">10 Garments</div>
            <div className="mt-1 text-xs text-muted-foreground">
              <span>Across 6 curated departments</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inventory Health
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight">25 Sku Tracks</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <span>96% in optimal stock condition</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 mb-8">
        {/* 2. Recent Customer Orders */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Recent Customer Orders
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time transactions across Indian and international fashion storefronts.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
              <Link href="/orders">View All Orders</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Ensemble</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {SAMPLE_ORDERS.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell className="font-mono font-semibold text-primary">
                      {ord.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{ord.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{ord.customerEmail}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {ord.items}
                    </TableCell>
                    <TableCell className="font-bold tabular-nums">
                      ${ord.total.toFixed(2)}
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
                        className="rounded-full px-2 py-0 text-[10px] capitalize font-semibold"
                      >
                        {ord.fulfillmentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-[11px]">
                      {ord.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 3. Top Selling Fashion Pieces */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Best Selling Ensembles
            </h2>
            <Link
              href="/products"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Catalog →
            </Link>
          </div>

          <Card className="rounded-2xl border-border/80">
            <CardContent className="p-4 space-y-4">
              {TOP_PRODUCTS.map((prod, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground line-clamp-1">
                      {prod.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{prod.category}</span>
                      <span>•</span>
                      <span>{prod.salesCount} sold</span>
                    </div>
                  </div>
                  <div className="text-right tabular-nums shrink-0">
                    <div className="text-xs font-extrabold text-foreground">
                      ${prod.revenue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {prod.inStock} left
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Operations Actions */}
          <Card className="rounded-2xl border-border/80 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                Quick Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Button asChild variant="outline" size="sm" className="w-full justify-between rounded-xl text-xs h-9">
                <Link href="/inventory">
                  <span>Stock Adjustments Ledger</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full justify-between rounded-xl text-xs h-9">
                <Link href="/categories">
                  <span>Manage Clothing Categories</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full justify-between rounded-xl text-xs h-9">
                <Link href="/collections">
                  <span>Configure Lookbook Edits</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
