import { Request, Response, NextFunction } from "express";
import { analyticsService } from "../services/analytics.service";
import { AnalyticsDateRangeFilter, ApiAnalyticsCode } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

export class AnalyticsController {
  /**
   * GET /api/v1/admin/analytics/dashboard
   */
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as AnalyticsDateRangeFilter;
      const data = await analyticsService.getComprehensiveDashboard(query);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiAnalyticsCode.ADMIN_ANALYTICS_DASHBOARD_FETCHED,
        message: "Comprehensive dashboard metrics retrieved successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics/revenue
   */
  public async getRevenueAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as AnalyticsDateRangeFilter;
      const data = await analyticsService.getRevenueOverview(query);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiAnalyticsCode.ADMIN_ANALYTICS_REVENUE_FETCHED,
        message: "Revenue analytics retrieved successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics/orders
   */
  public async getOrdersAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as AnalyticsDateRangeFilter;
      const data = await analyticsService.getOrdersOverview(query);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiAnalyticsCode.ADMIN_ANALYTICS_ORDERS_FETCHED,
        message: "Order analytics retrieved successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics/customers
   */
  public async getCustomersAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as AnalyticsDateRangeFilter;
      const data = await analyticsService.getCustomersOverview(query);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiAnalyticsCode.ADMIN_ANALYTICS_CUSTOMERS_FETCHED,
        message: "Customer analytics retrieved successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics/products
   */
  public async getProductsAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as AnalyticsDateRangeFilter;
      const data = await analyticsService.getProductsOverview(query);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiAnalyticsCode.ADMIN_ANALYTICS_PRODUCTS_FETCHED,
        message: "Product performance analytics retrieved successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics/inventory
   */
  public async getInventoryAnalytics(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await analyticsService.getInventoryOverview();

      sendSuccess(res, {
        statusCode: 200,
        code: ApiAnalyticsCode.ADMIN_ANALYTICS_INVENTORY_FETCHED,
        message: "Inventory health analytics retrieved successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
