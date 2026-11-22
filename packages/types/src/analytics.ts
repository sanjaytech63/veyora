import { OrderStatus } from "./order";

export type AnalyticsPeriod = "today" | "7d" | "30d" | "90d" | "12m" | "ytd" | "custom";

export interface AnalyticsDateRangeFilter {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface RevenueTimelinePoint {
  date: string;
  revenue: number;
  netRevenue: number;
  orders: number;
  aov: number;
}

export interface RevenueOverviewDto {
  totalRevenue: number;
  previousPeriodRevenue: number;
  revenueGrowthRate: number; // percentage (-100 to +inf)
  netRevenue: number;
  averageOrderValue: number;
  discountTotal: number;
  refundedTotal: number;
  timeline: RevenueTimelinePoint[];
}

export interface OrderStatusDistribution {
  status: OrderStatus;
  count: number;
  revenue: number;
  percentage: number;
}

export interface OrdersTimelinePoint {
  date: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface OrdersOverviewDto {
  totalOrders: number;
  previousPeriodOrders: number;
  ordersGrowthRate: number;
  cancellationRate: number; // percentage
  statusDistribution: OrderStatusDistribution[];
  timeline: OrdersTimelinePoint[];
}

export interface TopCustomerDto {
  userId: string;
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface CustomersOverviewDto {
  totalCustomers: number;
  newCustomers: number;
  previousPeriodNewCustomers: number;
  customerGrowthRate: number;
  activeOrderingCustomers: number;
  repeatCustomers: number;
  repeatCustomerRate: number; // percentage
  topCustomers: TopCustomerDto[];
  acquisitionTimeline: Array<{ date: string; newCustomers: number }>;
}

export interface TopSellingProductDto {
  productId: string;
  title: string;
  sku: string;
  price: number;
  unitsSold: number;
  totalRevenue: number;
  currentStock: number;
  image?: string;
}

export interface ProductsOverviewDto {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  outOfStockProducts: number;
  topSelling: TopSellingProductDto[];
}

export interface LowStockAlertDto {
  productId: string;
  productTitle: string;
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
}

export interface InventoryOverviewDto {
  totalInventoryUnits: number;
  availableUnits: number;
  reservedUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockAlerts: LowStockAlertDto[];
}

export interface DashboardRecentOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
  itemsSummary: string;
  createdAt: string;
}

export interface ComprehensiveDashboardDto {
  dateRange: {
    from: string;
    to: string;
    period: AnalyticsPeriod;
  };
  revenue: RevenueOverviewDto;
  orders: OrdersOverviewDto;
  customers: CustomersOverviewDto;
  products: ProductsOverviewDto;
  inventory: InventoryOverviewDto;
  recentOrders: DashboardRecentOrderDto[];
}
