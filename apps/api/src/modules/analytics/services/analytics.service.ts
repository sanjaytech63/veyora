/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import {
  AnalyticsPeriod,
  AnalyticsDateRangeFilter,
  ComprehensiveDashboardDto,
  RevenueOverviewDto,
  OrdersOverviewDto,
  CustomersOverviewDto,
  ProductsOverviewDto,
  InventoryOverviewDto,
  DashboardRecentOrderDto,
  OrderStatusDistribution,
} from "@veyora/types";
import { Order } from "../../checkout/models/order.model";
import { Product } from "../../catalog/models/product.model";
import { Inventory } from "../../inventory/models/inventory.model";
import { User } from "../../auth/models/user.model";

export class AnalyticsService {
  /**
   * Resolve exact start, end, and prior comparison date boundaries based on period or custom inputs
   */
  public resolveDateRange(filter: AnalyticsDateRangeFilter): {
    start: Date;
    end: Date;
    priorStart: Date;
    priorEnd: Date;
    period: AnalyticsPeriod;
  } {
    const period = filter.period || "30d";
    const now = new Date();
    let start: Date;
    let end: Date = filter.endDate ? new Date(filter.endDate) : now;

    if (filter.startDate) {
      start = new Date(filter.startDate);
    } else {
      switch (period) {
        case "today": {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          break;
        }
        case "7d": {
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        }
        case "90d": {
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        }
        case "12m": {
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        }
        case "ytd": {
          start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
          break;
        }
        case "30d":
        default: {
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        }
      }
    }

    // Ensure valid chronological window
    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    // Calculate duration for proportional prior period comparison
    const durationMs = end.getTime() - start.getTime();
    const priorEnd = new Date(start.getTime());
    const priorStart = new Date(priorEnd.getTime() - durationMs);

    return { start, end, priorStart, priorEnd, period };
  }

  /**
   * Helper to compute safe growth percentage
   */
  private calculateGrowth(current: number, previous: number): number {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }
    const rate = ((current - previous) / previous) * 100;
    return Math.round(rate * 10) / 10;
  }

  /**
   * 1. REVENUE OVERVIEW & TIMELINE
   */
  public async getRevenueOverview(filter: AnalyticsDateRangeFilter): Promise<RevenueOverviewDto> {
    const { start, end, priorStart, priorEnd } = this.resolveDateRange(filter);

    // Current period revenue aggregation (bounded by indexed createdAt range)
    const currentAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          subtotalSum: { $sum: "$subtotal" },
          discountTotal: { $sum: "$discount" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // Prior period comparison aggregation
    const priorAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: priorStart, $lte: priorEnd },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
        },
      },
    ]);

    // Refunded total in current period
    const refundedAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: "refunded",
        },
      },
      {
        $group: {
          _id: null,
          refundedTotal: { $sum: "$total" },
        },
      },
    ]);

    const totalRevenue = currentAgg[0]?.totalRevenue || 0;
    const previousPeriodRevenue = priorAgg[0]?.totalRevenue || 0;
    const discountTotal = currentAgg[0]?.discountTotal || 0;
    const refundedTotal = refundedAgg[0]?.refundedTotal || 0;
    const orderCount = currentAgg[0]?.orderCount || 0;
    const netRevenue = Math.max(0, totalRevenue - refundedTotal);
    const averageOrderValue = orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0;
    const revenueGrowthRate = this.calculateGrowth(totalRevenue, previousPeriodRevenue);

    // Daily/Periodic Revenue Timeline
    const timelineAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const timeline = timelineAgg.map((point) => ({
      date: point._id,
      revenue: point.revenue,
      netRevenue: point.revenue,
      orders: point.orders,
      aov: point.orders > 0 ? Math.round((point.revenue / point.orders) * 100) / 100 : 0,
    }));

    return {
      totalRevenue,
      previousPeriodRevenue,
      revenueGrowthRate,
      netRevenue,
      averageOrderValue,
      discountTotal,
      refundedTotal,
      timeline,
    };
  }

  /**
   * 2. ORDERS OVERVIEW & STATUS DISTRIBUTION
   */
  public async getOrdersOverview(filter: AnalyticsDateRangeFilter): Promise<OrdersOverviewDto> {
    const { start, end, priorStart, priorEnd } = this.resolveDateRange(filter);

    // Current total orders and status breakdown
    const statusAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
    ]);

    // Prior period total orders
    const priorOrderCount = await Order.countDocuments({
      createdAt: { $gte: priorStart, $lte: priorEnd },
    });

    let totalOrders = 0;
    let cancelledCount = 0;
    for (const item of statusAgg) {
      totalOrders += item.count;
      if (item._id === "cancelled") {
        cancelledCount = item.count;
      }
    }

    const ordersGrowthRate = this.calculateGrowth(totalOrders, priorOrderCount);
    const cancellationRate = totalOrders > 0 ? Math.round((cancelledCount / totalOrders) * 1000) / 10 : 0;

    const statusDistribution: OrderStatusDistribution[] = statusAgg.map((item) => ({
      status: item._id,
      count: item.count,
      revenue: item.revenue,
      percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 1000) / 10 : 0,
    }));

    // Orders Timeline
    const timelineAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const timeline = timelineAgg.map((point) => ({
      date: point._id,
      totalOrders: point.totalOrders,
      completedOrders: point.completedOrders,
      cancelledOrders: point.cancelledOrders,
    }));

    return {
      totalOrders,
      previousPeriodOrders: priorOrderCount,
      ordersGrowthRate,
      cancellationRate,
      statusDistribution,
      timeline,
    };
  }

  /**
   * 3. CUSTOMERS OVERVIEW & COHORTS
   */
  public async getCustomersOverview(filter: AnalyticsDateRangeFilter): Promise<CustomersOverviewDto> {
    const { start, end, priorStart, priorEnd } = this.resolveDateRange(filter);

    // Total registered customer count
    const totalCustomers = await User.countDocuments({ role: "customer" });

    // New customers in date range
    const newCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: start, $lte: end },
    });

    // New customers in prior period
    const previousPeriodNewCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: priorStart, $lte: priorEnd },
    });

    const customerGrowthRate = this.calculateGrowth(newCustomers, previousPeriodNewCustomers);

    // Customer purchase frequency within range
    const customerOrderAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          userId: { $ne: null },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$userId",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          name: { $first: "$customerName" },
          email: { $first: "$customerEmail" },
        },
      },
      { $sort: { totalSpent: -1 } },
    ]);

    const activeOrderingCustomers = customerOrderAgg.length;
    let repeatCustomers = 0;
    for (const c of customerOrderAgg) {
      if (c.orderCount > 1) {
        repeatCustomers++;
      }
    }

    const repeatCustomerRate =
      activeOrderingCustomers > 0
        ? Math.round((repeatCustomers / activeOrderingCustomers) * 1000) / 10
        : 0;

    const topCustomers = customerOrderAgg.slice(0, 5).map((c) => ({
      userId: c._id.toString(),
      name: c.name || "Valued Client",
      email: c.email || "client@veyora.luxury",
      totalSpent: c.totalSpent,
      orderCount: c.orderCount,
      averageOrderValue: Math.round((c.totalSpent / c.orderCount) * 100) / 100,
    }));

    // Customer acquisition timeline
    const acquisitionTimelineAgg = await User.aggregate([
      {
        $match: {
          role: "customer",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          newCustomers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const acquisitionTimeline = acquisitionTimelineAgg.map((point) => ({
      date: point._id,
      newCustomers: point.newCustomers,
    }));

    return {
      totalCustomers,
      newCustomers,
      previousPeriodNewCustomers,
      customerGrowthRate,
      activeOrderingCustomers,
      repeatCustomers,
      repeatCustomerRate,
      topCustomers,
      acquisitionTimeline,
    };
  }

  /**
   * 4. PRODUCTS OVERVIEW & BESTSELLERS
   */
  public async getProductsOverview(filter: AnalyticsDateRangeFilter): Promise<ProductsOverviewDto> {
    const { start, end } = this.resolveDateRange(filter);
    const limit = filter.limit || 5;

    // Catalog status metrics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: "active" });
    const draftProducts = await Product.countDocuments({ status: "draft" });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Top selling products aggregation bounded to date range
    const topSellingAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $nin: ["cancelled"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          title: { $first: "$items.title" },
          sku: { $first: "$items.sku" },
          price: { $first: "$items.price" },
          image: { $first: "$items.image" },
          unitsSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ]);

    const topSelling = await Promise.all(
      topSellingAgg.map(async (item) => {
        let currentStock = 0;
        let thumbnail = item.image;

        if (mongoose.Types.ObjectId.isValid(item._id)) {
          const product = await Product.findById(item._id).select("stock images");
          if (product) {
            currentStock = product.stock;
            if (!thumbnail && product.images?.[0]?.url) {
              thumbnail = product.images[0].url;
            }
          }
        }

        return {
          productId: item._id?.toString() || "",
          title: item.title,
          sku: item.sku,
          price: item.price,
          unitsSold: item.unitsSold,
          totalRevenue: item.totalRevenue,
          currentStock,
          image: thumbnail,
        };
      })
    );

    return {
      totalProducts,
      activeProducts,
      draftProducts,
      outOfStockProducts,
      topSelling,
    };
  }

  /**
   * 5. INVENTORY OVERVIEW & RE-STOCK ALERTS
   */
  public async getInventoryOverview(): Promise<InventoryOverviewDto> {
    // Inventory metrics from Inventory collection (fallback to Product if empty)
    const inventoryCount = await Inventory.countDocuments();

    let totalInventoryUnits = 0;
    let availableUnits = 0;
    let reservedUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let lowStockAlerts: any[] = [];

    if (inventoryCount > 0) {
      const invAgg = await Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalOnHand: { $sum: "$onHand" },
            totalAvailable: { $sum: "$available" },
            totalReserved: { $sum: "$reserved" },
          },
        },
      ]);

      totalInventoryUnits = invAgg[0]?.totalOnHand || 0;
      availableUnits = invAgg[0]?.totalAvailable || 0;
      reservedUnits = invAgg[0]?.totalReserved || 0;

      lowStockCount = await Inventory.countDocuments({
        $expr: { $lte: ["$available", "$lowStockThreshold"] },
        available: { $gt: 0 },
      });

      outOfStockCount = await Inventory.countDocuments({ available: 0 });

      const alerts = await Inventory.find({
        $expr: { $lte: ["$available", "$lowStockThreshold"] },
      })
        .sort({ available: 1 })
        .limit(10)
        .lean();

      lowStockAlerts = alerts.map((a: any) => ({
        productId: a.productId.toString(),
        productTitle: a.productTitle,
        sku: a.sku,
        onHand: a.onHand,
        reserved: a.reserved,
        available: a.available,
        lowStockThreshold: a.lowStockThreshold,
      }));
    } else {
      // Fallback: derive directly from Product catalog
      const prodAgg = await Product.aggregate([
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$stock" },
          },
        },
      ]);

      totalInventoryUnits = prodAgg[0]?.totalStock || 0;
      availableUnits = totalInventoryUnits;
      reservedUnits = 0;
      lowStockCount = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });
      outOfStockCount = await Product.countDocuments({ stock: 0 });

      const alertProducts = await Product.find({ stock: { $lte: 10 } })
        .sort({ stock: 1 })
        .limit(10)
        .lean();

      lowStockAlerts = alertProducts.map((p: any) => ({
        productId: p._id.toString(),
        productTitle: p.title,
        sku: p.sku,
        onHand: p.stock,
        reserved: 0,
        available: p.stock,
        lowStockThreshold: 10,
      }));
    }

    return {
      totalInventoryUnits,
      availableUnits,
      reservedUnits,
      lowStockCount,
      outOfStockCount,
      lowStockAlerts,
    };
  }

  /**
   * 6. RECENT ORDERS STREAM
   */
  public async getRecentOrders(limit = 5): Promise<DashboardRecentOrderDto[]> {
    const orders: any[] = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return orders.map((o: any) => {
      const itemsList = o.items || [];
      const itemsSummary =
        itemsList.length > 0
          ? `${itemsList[0].title}${itemsList.length > 1 ? ` (+${itemsList.length - 1} more)` : ""}`
          : "Haute Couture item";

      return {
        id: o._id.toString(),
        orderNumber: o.orderNumber,
        customerName: o.customerName || "VIP Client",
        customerEmail: o.customerEmail,
        total: o.total,
        status: o.status,
        itemCount: itemsList.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0),
        itemsSummary,
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
      };
    });
  }

  /**
   * 7. MASTER COMPREHENSIVE DASHBOARD METRIC AGGREGATION
   */
  public async getComprehensiveDashboard(filter: AnalyticsDateRangeFilter): Promise<ComprehensiveDashboardDto> {
    const { start, end, period } = this.resolveDateRange(filter);

    // Parallel aggregation execution across bounded collections
    const [revenue, orders, customers, products, inventory, recentOrders] = await Promise.all([
      this.getRevenueOverview(filter),
      this.getOrdersOverview(filter),
      this.getCustomersOverview(filter),
      this.getProductsOverview(filter),
      this.getInventoryOverview(),
      this.getRecentOrders(filter.limit || 5),
    ]);

    return {
      dateRange: {
        from: start.toISOString(),
        to: end.toISOString(),
        period,
      },
      revenue,
      orders,
      customers,
      products,
      inventory,
      recentOrders,
    };
  }
}

export const analyticsService = new AnalyticsService();
