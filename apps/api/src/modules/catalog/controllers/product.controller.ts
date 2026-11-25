import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { ProductQueryInput } from "@veyora/validators";
import { sendSuccess } from "../../../utils/response";

export class ProductController {
  async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";
      const result = await productService.getProducts(
        req.query as unknown as ProductQueryInput,
        isAdmin
      );

      sendSuccess(res, {
        statusCode: 200,
        code: "PRODUCTS_FETCHED",
        message: "Products retrieved successfully.",
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";
      const product = await productService.getProductByIdOrSlug(req.params["idOrSlug"]!, isAdmin);

      sendSuccess(res, {
        statusCode: 200,
        code: "PRODUCT_FETCHED",
        message: "Product details retrieved successfully.",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);

      sendSuccess(res, {
        statusCode: 201,
        code: "PRODUCT_CREATED",
        message: "Product created successfully.",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.updateProduct(req.params["id"]!, req.body);

      sendSuccess(res, {
        statusCode: 200,
        code: "PRODUCT_UPDATED",
        message: "Product updated successfully.",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hardDelete = req.query.hard === "true";
      await productService.deleteProduct(req.params["id"]!, hardDelete);

      const message = hardDelete ? "Product deleted permanently." : "Product archived.";
      sendSuccess(res, {
        statusCode: 200,
        code: "PRODUCT_DELETED",
        message,
        data: { message, deleted: true },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await productService.getCatalogStats();

      sendSuccess(res, {
        statusCode: 200,
        code: "CATALOG_STATS_FETCHED",
        message: "Catalog statistics retrieved successfully.",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
