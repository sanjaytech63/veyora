"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users,
  Shirt,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";
import { adminAnalyticsApi } from "@/lib/api/admin-analytics-api";
import { adminAnalyticsKeys } from "@/lib/api/query-keys";
import { DashboardDateFilter } from "@/components/dashboard/dashboard-date-filter";
import { AnalyticsPeriod, OrderStatus } from "@veyora/types";

// Heavy Recharts components dynamically imported to optimize initial client bundle and INP
const RevenueChart = dynamic(
  () => import("@/components/dashboard/revenue-chart").then((m) => m.RevenueChart),
  {
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
        <span className="text-xs text-muted-foreground">Loading revenue timeline...</span>
      </div>
    ),
    ssr: false,
  }
);

const OrderStatusChart = dynamic(
  () => import("@/components/dashboard/order-status-chart").then((m) => m.OrderStatusChart),
  {
    loading: () => (
      <div className="flex h-[280px] w-full items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
        <span className="text-xs text-muted-foreground">Loading order status analytics...</span>
      </div>
    ),
    ssr: false,
  }
);

const TopProductsChart = dynamic(
  () => import("@/components/dashboard/top-products-chart").then((m) => m.TopProductsChart),
  {
    loading: () => (
      <div className="flex h-[300px] w-full items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
        <span className="text-xs text-muted-foreground">Loading top product sales...</span>
      </div>
    ),
    ssr: false,
  }
);

const CustomerGrowthChart = dynamic(
  () => import("@/components/dashboard/customer-growth-chart").then((m) => m.CustomerGrowthChart),
  {
    loading: () => (
      <div className="flex h-[260px] w-full items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
        <span className="text-xs text-muted-foreground">Loading customer growth telemetry...</span>
      </div>
    ),
    ssr: false,
  }
);

const ORDER_STATUS_BADGE_VARIANTS: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  processing: {
    label: "Processing",
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  shipped: {
    label: "Shipped",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  refund_pending: {
    label: "Refund Pending",
    className: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  },
  refunded: {
    label: "Refunded",
    className: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
  },
};

export function DashboardClient() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = React.useState<AnalyticsPeriod>("30d");
  const [customStart, setCustomStart] = React.useState<string | undefined>();
  const [customEnd, setCustomEnd] = React.useState<string | undefined>();

  // Fetch comprehensive master analytics
  const {
    data: dashboardData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: adminAnalyticsKeys.dashboard({ period, customStart, customEnd }),
    queryFn: () =>
      adminAnalyticsApi.getDashboard({
        period,
        startDate: customStart,
        endDate: customEnd,
        limit: 5,
      }),
    staleTime: 60 * 1000,
  });

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: adminAnalyticsKeys.all });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStart(new Date(start).toISOString());
    setCustomEnd(new Date(end).toISOString());
  };

  const formatCurrency = (amount: number) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const revenue = dashboardData?.revenue;
  const orders = dashboardData?.orders;
  const customers = dashboardData?.customers;
  const products = dashboardData?.products;
  const inventory = dashboardData?.inventory;
  const recentOrders = dashboardData?.recentOrders || [];

  return (
    <PageContainer
      title="Executive Commerce Operations"
      description="Real-time multi-channel revenue analytics, fulfillment status, and atelier inventory metrics."
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          <DashboardDateFilter
            period={period}
            onPeriodChange={(newPeriod) => {
              setPeriod(newPeriod);
              if (newPeriod !== "custom") {
                setCustomStart(undefined);
                setCustomEnd(undefined);
              }
            }}
            startDate={customStart}
            endDate={customEnd}
            onCustomDateChange={handleCustomDateChange}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-9 gap-1.5 rounded-xl text-xs font-semibold border-border/80"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Sync Metrics
          </Button>

          <Button
            asChild
            size="sm"
            className="h-9 gap-1.5 rounded-xl text-xs font-semibold shadow-xs"
          >
            <Link href="/products/new">
              <Plus className="h-3.5 w-3.5" />
              Add Garment
            </Link>
          </Button>
        </div>
      }
    >
      {/* 1. EXECUTIVE KPI SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {/* Card 1: Revenue Overview */}
        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-emerald-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {isLoading ? "—" : formatCurrency(revenue?.totalRevenue || 0)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <div
                className={`flex items-center gap-1 font-semibold ${
                  (revenue?.revenueGrowthRate || 0) >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {(revenue?.revenueGrowthRate || 0) >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>
                  {(revenue?.revenueGrowthRate || 0) >= 0 ? "+" : ""}
                  {revenue?.revenueGrowthRate || 0}%
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Net: {formatCurrency(revenue?.netRevenue || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Orders Overview */}
        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-primary/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Orders Volume
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {isLoading ? "—" : `${orders?.totalOrders || 0} Orders`}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <div
                className={`flex items-center gap-1 font-semibold ${
                  (orders?.ordersGrowthRate || 0) >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {(orders?.ordersGrowthRate || 0) >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>
                  {(orders?.ordersGrowthRate || 0) >= 0 ? "+" : ""}
                  {orders?.ordersGrowthRate || 0}%
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                AOV: {formatCurrency(revenue?.averageOrderValue || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Customers Overview */}
        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-purple-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Client Base
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {isLoading ? "—" : `${customers?.totalCustomers || 0} Clients`}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                +{customers?.newCustomers || 0} in interval
              </span>
              <span className="text-[11px] text-muted-foreground">
                Repeat: {customers?.repeatCustomerRate || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Products Overview */}
        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-indigo-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Catalog Items
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Shirt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {isLoading ? "—" : `${products?.activeProducts || 0} Active`}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Total: {products?.totalProducts || 0}</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {products?.outOfStockProducts || 0} Out of Stock
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Inventory Overview */}
        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inventory Health
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              {isLoading ? "—" : `${inventory?.totalInventoryUnits || 0} Units`}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {inventory?.availableUnits || 0} Available
              </span>
              {(inventory?.lowStockCount || 0) > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {inventory?.lowStockCount} Low
                </span>
              ) : (
                <span className="text-muted-foreground text-[11px]">100% Stocked</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. ANALYTICS TABS & CHARTS */}
      <Tabs defaultValue="revenue" className="space-y-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
          <TabsList className="bg-muted/40 p-1 rounded-xl">
            <TabsTrigger value="revenue" className="rounded-lg text-xs font-semibold px-4 py-1.5">
              Revenue & Fulfillment
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg text-xs font-semibold px-4 py-1.5">
              Product Bestsellers
            </TabsTrigger>
            <TabsTrigger value="customers" className="rounded-lg text-xs font-semibold px-4 py-1.5">
              Clientele Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Revenue & Fulfillment Charts */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-8 rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">Revenue Trend</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Historical gross sales revenue trajectory for the selected timeframe.
                  </p>
                </div>
                <Badge variant="outline" className="rounded-lg text-xs font-medium">
                  {revenue?.timeline?.length || 0} Intervals
                </Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <RevenueChart data={revenue?.timeline || []} isLoading={isLoading} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Fulfillment Status
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Order status distribution across atelier lifecycle.
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <OrderStatusChart data={orders?.statusDistribution || []} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Product Performance */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-6 rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Top Garments by Revenue
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Highest volume revenue generators during this period.
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <TopProductsChart data={products?.topSelling || []} isLoading={isLoading} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-6 rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Bestseller Inventory Matrix
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Performance breakdown and current atelier stock levels.
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="rounded-xl border border-border/80 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border/60">
                        <TableHead className="text-xs font-semibold">Garment</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Sold</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Revenue</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(products?.topSelling || []).map((p) => (
                        <TableRow key={p.productId} className="border-border/60">
                          <TableCell className="text-xs font-medium max-w-[180px] truncate">
                            {p.title}
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {p.sku}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-right font-semibold">
                            {p.unitsSold}
                          </TableCell>
                          <TableCell className="text-xs text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                p.currentStock > 10
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : p.currentStock > 0
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              }`}
                            >
                              {p.currentStock} left
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!products?.topSelling || products.topSelling.length === 0) && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-6 text-xs text-muted-foreground"
                          >
                            No sales records available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Customer Cohorts */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-6 rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  New Client Acquisition
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Daily customer registration trajectory across this window.
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <CustomerGrowthChart
                  data={customers?.acquisitionTimeline || []}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-6 rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground">Top VIP Clients</CardTitle>
                <p className="text-xs text-muted-foreground">
                  High-net-worth patrons by cumulative spend.
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="rounded-xl border border-border/80 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border/60">
                        <TableHead className="text-xs font-semibold">Client</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Orders</TableHead>
                        <TableHead className="text-xs font-semibold text-right">
                          Total Spent
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right">AOV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(customers?.topCustomers || []).map((c) => (
                        <TableRow key={c.userId} className="border-border/60">
                          <TableCell className="text-xs font-medium">
                            {c.name}
                            <div className="text-[10px] text-muted-foreground">{c.email}</div>
                          </TableCell>
                          <TableCell className="text-xs text-right font-semibold">
                            {c.orderCount}
                          </TableCell>
                          <TableCell className="text-xs text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(c.totalSpent)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium">
                            {formatCurrency(c.averageOrderValue)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!customers?.topCustomers || customers.topCustomers.length === 0) && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-6 text-xs text-muted-foreground"
                          >
                            No customer order records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 3. OPERATIONAL DATA TABLES */}
      <div className="grid gap-8 lg:grid-cols-12 mb-8">
        {/* Table 1: Live Recent Orders */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Recent Orders Stream
              </h2>
              <p className="text-xs text-muted-foreground">
                Live transactional orders placed across all digital atelier channels.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1 rounded-xl text-xs font-semibold"
            >
              <Link href="/orders">
                View All Orders
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/60">
                  <TableHead className="text-xs font-semibold">Order Number</TableHead>
                  <TableHead className="text-xs font-semibold">Client</TableHead>
                  <TableHead className="text-xs font-semibold">Items</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => {
                  const badge = ORDER_STATUS_BADGE_VARIANTS[order.status] || {
                    label: order.status,
                    className: "bg-muted text-muted-foreground",
                  };
                  return (
                    <TableRow key={order.id} className="border-border/60 hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{order.customerName}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {order.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {order.itemsSummary}
                      </TableCell>
                      <TableCell className="text-xs font-extrabold text-right text-foreground">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`rounded-lg text-[10px] font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 w-7 p-0 rounded-lg"
                        >
                          <Link href={`/orders/${order.id}`}>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      No customer orders placed yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Table 2: Low Stock Restock Alerts */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Stock Depletion Alerts
              </h2>
              <p className="text-xs text-muted-foreground">
                Garments at or below critical threshold.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1 rounded-xl text-xs font-semibold"
            >
              <Link href="/inventory">
                Inventory
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="p-3 bg-amber-500/5 border-b border-border/60 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                {inventory?.lowStockCount || 0} SKUs require immediate atelier procurement
              </span>
            </div>

            <div className="divide-y divide-border/60 max-h-[350px] overflow-y-auto">
              {(inventory?.lowStockAlerts || []).map((alert) => (
                <div
                  key={alert.sku}
                  className="p-3 flex items-center justify-between hover:bg-muted/20"
                >
                  <div className="space-y-0.5 max-w-[190px]">
                    <div className="text-xs font-bold text-foreground truncate">
                      {alert.productTitle}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      SKU: {alert.sku}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        alert.available === 0
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {alert.available === 0 ? "Out of Stock" : `${alert.available} units`}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground">
                      Thresh: {alert.lowStockThreshold}
                    </div>
                  </div>
                </div>
              ))}
              {(!inventory?.lowStockAlerts || inventory.lowStockAlerts.length === 0) && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  All garments are at healthy inventory levels.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
