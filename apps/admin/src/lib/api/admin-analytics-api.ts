import { apiClient } from "./api-client";
import {
  ComprehensiveDashboardDto,
  RevenueOverviewDto,
  OrdersOverviewDto,
  CustomersOverviewDto,
  ProductsOverviewDto,
  InventoryOverviewDto,
  AnalyticsDateRangeFilter,
} from "@veyora/types";

export const adminAnalyticsApi = {
  getDashboard: (query?: AnalyticsDateRangeFilter): Promise<ComprehensiveDashboardDto> =>
    apiClient.get<ComprehensiveDashboardDto>("/admin/analytics/dashboard", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getRevenue: (query?: AnalyticsDateRangeFilter): Promise<RevenueOverviewDto> =>
    apiClient.get<RevenueOverviewDto>("/admin/analytics/revenue", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getOrders: (query?: AnalyticsDateRangeFilter): Promise<OrdersOverviewDto> =>
    apiClient.get<OrdersOverviewDto>("/admin/analytics/orders", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getCustomers: (query?: AnalyticsDateRangeFilter): Promise<CustomersOverviewDto> =>
    apiClient.get<CustomersOverviewDto>("/admin/analytics/customers", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getProducts: (query?: AnalyticsDateRangeFilter): Promise<ProductsOverviewDto> =>
    apiClient.get<ProductsOverviewDto>("/admin/analytics/products", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getInventory: (): Promise<InventoryOverviewDto> =>
    apiClient.get<InventoryOverviewDto>("/admin/analytics/inventory"),
};
