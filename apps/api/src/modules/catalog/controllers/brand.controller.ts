import { Request, Response, NextFunction } from "express";
import { brandService } from "../services/brand.service";
import { BrandStatus } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

export class BrandController {
  async listBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status =
        typeof req.query.status === "string" ? (req.query.status as BrandStatus) : undefined;
      const brands = await brandService.getBrands(status ? { status } : undefined);

      sendSuccess(res, {
        statusCode: 200,
        code: "BRANDS_FETCHED",
        message: "Brands retrieved successfully.",
        data: brands,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandService.getBrandByIdOrSlug(req.params["idOrSlug"]!);

      sendSuccess(res, {
        statusCode: 200,
        code: "BRAND_FETCHED",
        message: "Brand details retrieved successfully.",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandService.createBrand(req.body);

      sendSuccess(res, {
        statusCode: 201,
        code: "BRAND_CREATED",
        message: "Brand created successfully.",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandService.updateBrand(req.params["id"]!, req.body);

      sendSuccess(res, {
        statusCode: 200,
        code: "BRAND_UPDATED",
        message: "Brand updated successfully.",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await brandService.deleteBrand(req.params["id"]!);

      sendSuccess(res, {
        statusCode: 200,
        code: "BRAND_DELETED",
        message: "Brand deleted successfully.",
        data: { message: "Brand deleted successfully.", deleted: true },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandController = new BrandController();
