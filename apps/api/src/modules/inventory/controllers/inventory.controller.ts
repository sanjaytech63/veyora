import { Request, Response, NextFunction } from "express";
import { inventoryService } from "../services/inventory.service";
import { InventoryQueryInput } from "@veyora/validators";

export class InventoryController {
  async listInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await inventoryService.getInventoryItems(
        req.query as unknown as InventoryQueryInput
      );

      res.status(200).json({
        success: true,
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await inventoryService.getInventoryStats();

      res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: InventoryQueryInput = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        lowStockOnly: true,
        status: "all",
        sortBy: "available",
        sortOrder: "asc",
      };

      const result = await inventoryService.getInventoryItems(query);

      res.status(200).json({
        success: true,
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.getInventoryBySkuOrId(req.params["skuOrId"]!);

      res.status(200).json({
        success: true,
        data: item,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await inventoryService.getMovements(req.params["skuOrId"]!, page, limit);

      res.status(200).json({
        success: true,
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user ? { id: req.user.id, email: req.user.email } : undefined;
      const item = await inventoryService.adjustStock(req.body, user);

      res.status(200).json({
        success: true,
        data: item,
        message: "Stock adjusted successfully.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async reserveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.reserveStock(req.body);

      res.status(200).json({
        success: true,
        data: item,
        message: "Stock reserved successfully.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async releaseReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.releaseReservation(req.body);

      res.status(200).json({
        success: true,
        data: item,
        message: "Reservation released successfully.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async commitReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.commitReservation(req.body);

      res.status(200).json({
        success: true,
        data: item,
        message: "Reservation committed successfully.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateThreshold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.updateThreshold(
        req.params["skuOrId"]!,
        Number(req.body.lowStockThreshold)
      );

      res.status(200).json({
        success: true,
        data: item,
        message: "Low stock threshold updated successfully.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
