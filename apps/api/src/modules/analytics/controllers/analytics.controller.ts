import { Request, Response, NextFunction } from "express";
import { analyticsService } from "../services/analytics.service";
import { AnalyticsDateRangeFilter } from "@veyora/types";

export class AnalyticsController {
  /**
   * GET /api/v1/admin/analytics/dashboard
   */
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as AnalyticsDateRangeFilter;
      const data = await analyticsService.getComprehensiveDashboard(query);

      res.status(200).json({
        success: true,
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

      res.status(200).json({
        success: true,
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

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics/customers
   */
  public async getCustomersAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as AnalyticsDateRangeFilter;
      const data = await analyticsService.getCustomersOverview(query);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics/products
   */
  public async getProductsAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as AnalyticsDateRangeFilter;
      const data = await analyticsService.getProductsOverview(query);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics/inventory
   */
  public async getInventoryAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getInventoryOverview();

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
