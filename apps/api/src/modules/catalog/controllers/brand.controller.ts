import { Request, Response, NextFunction } from "express";
import { brandService } from "../services/brand.service";
import { BrandStatus } from "@veyora/types";

export class BrandController {
  async listBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = typeof req.query.status === "string" ? (req.query.status as BrandStatus) : undefined;
      const brands = await brandService.getBrands(status ? { status } : undefined);

      res.status(200).json({
        success: true,
        data: brands,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandService.getBrandByIdOrSlug(req.params["idOrSlug"]!);

      res.status(200).json({
        success: true,
        data: brand,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async createBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandService.createBrand(req.body);

      res.status(201).json({
        success: true,
        data: brand,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandService.updateBrand(req.params["id"]!, req.body);

      res.status(200).json({
        success: true,
        data: brand,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await brandService.deleteBrand(req.params["id"]!);

      res.status(200).json({
        success: true,
        data: { message: "Brand deleted successfully." },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandController = new BrandController();
