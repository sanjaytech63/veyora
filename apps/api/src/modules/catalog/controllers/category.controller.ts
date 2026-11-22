import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";
import { CategoryStatus } from "@veyora/types";

export class CategoryController {
  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status =
        typeof req.query.status === "string" ? (req.query.status as CategoryStatus) : undefined;
      const categories = await categoryService.getCategories(status ? { status } : undefined);

      res.status(200).json({
        success: true,
        data: categories,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryTree(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await categoryService.getCategoryTree();

      res.status(200).json({
        success: true,
        data: tree,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.getCategoryByIdOrSlug(req.params["idOrSlug"]!);

      res.status(200).json({
        success: true,
        data: category,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.createCategory(req.body);

      res.status(201).json({
        success: true,
        data: category,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.updateCategory(req.params["id"]!, req.body);

      res.status(200).json({
        success: true,
        data: category,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoryService.deleteCategory(req.params["id"]!);

      res.status(200).json({
        success: true,
        data: { message: "Category deleted successfully." },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
