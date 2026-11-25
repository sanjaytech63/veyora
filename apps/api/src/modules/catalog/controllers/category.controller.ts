import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";
import { CategoryStatus } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

export class CategoryController {
  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status =
        typeof req.query.status === "string" ? (req.query.status as CategoryStatus) : undefined;
      const categories = await categoryService.getCategories(status ? { status } : undefined);

      sendSuccess(res, {
        statusCode: 200,
        code: "CATEGORIES_FETCHED",
        message: "Categories retrieved successfully.",
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryTree(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await categoryService.getCategoryTree();

      sendSuccess(res, {
        statusCode: 200,
        code: "CATEGORY_TREE_FETCHED",
        message: "Category hierarchy retrieved successfully.",
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.getCategoryByIdOrSlug(req.params["idOrSlug"]!);

      sendSuccess(res, {
        statusCode: 200,
        code: "CATEGORY_FETCHED",
        message: "Category details retrieved successfully.",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.createCategory(req.body);

      sendSuccess(res, {
        statusCode: 201,
        code: "CATEGORY_CREATED",
        message: "Category created successfully.",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.updateCategory(req.params["id"]!, req.body);

      sendSuccess(res, {
        statusCode: 200,
        code: "CATEGORY_UPDATED",
        message: "Category updated successfully.",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoryService.deleteCategory(req.params["id"]!);

      sendSuccess(res, {
        statusCode: 200,
        code: "CATEGORY_DELETED",
        message: "Category deleted successfully.",
        data: { message: "Category deleted successfully.", deleted: true },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
