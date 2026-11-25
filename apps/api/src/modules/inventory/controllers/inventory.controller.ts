import { Request, Response, NextFunction } from "express";
import { inventoryService } from "../services/inventory.service";
import { InventoryQueryInput } from "@veyora/validators";
import { ApiInventoryCode } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

export class InventoryController {
  async listInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await inventoryService.getInventoryItems(
        req.query as unknown as InventoryQueryInput
      );

      sendSuccess(res, {
        statusCode: 200,
        code: ApiInventoryCode.INVENTORY_ITEMS_FETCHED,
        message: "Inventory items retrieved successfully.",
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await inventoryService.getInventoryStats();

      sendSuccess(res, {
        statusCode: 200,
        code: ApiInventoryCode.INVENTORY_STATS_FETCHED,
        message: "Inventory statistics retrieved successfully.",
        data: stats,
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

      sendSuccess(res, {
        statusCode: 200,
        code: ApiInventoryCode.INVENTORY_LOW_STOCK_FETCHED,
        message: "Low stock inventory items retrieved successfully.",
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.getInventoryBySkuOrId(req.params["skuOrId"]!);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiInventoryCode.INVENTORY_ITEM_FETCHED,
        message: "Inventory item details retrieved successfully.",
        data: item,
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

      sendSuccess(res, {
        statusCode: 200,
        code: ApiInventoryCode.INVENTORY_MOVEMENTS_FETCHED,
        message: "Stock movement ledger retrieved successfully.",
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user ? { id: req.user.id, email: req.user.email } : undefined;
      const item = await inventoryService.adjustStock(req.body, user);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiInventoryCode.INVENTORY_ADJUSTED,
        message: "Stock adjusted successfully.",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async reserveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.reserveStock(req.body);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiInventoryCode.INVENTORY_RESERVED,
        message: "Stock reserved successfully.",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async releaseReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.releaseReservation(req.body);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiInventoryCode.INVENTORY_RELEASED,
        message: "Reservation released successfully.",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async commitReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.commitReservation(req.body);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiInventoryCode.INVENTORY_COMMITTED,
        message: "Reservation committed successfully.",
        data: item,
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

      sendSuccess(res, {
        statusCode: 200,
        code: ApiInventoryCode.INVENTORY_THRESHOLD_UPDATED,
        message: "Low stock threshold updated successfully.",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
