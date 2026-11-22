import { Request, Response, NextFunction } from "express";
import { collectionService } from "../services/collection.service";
import { CollectionStatus } from "@veyora/types";

export class CollectionController {
  async listCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status =
        typeof req.query["status"] === "string"
          ? (req.query["status"] as CollectionStatus)
          : undefined;
      const collections = await collectionService.getCollections(status ? { status } : undefined);

      res.status(200).json({
        success: true,
        data: collections,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = req.params["idOrSlug"]!;
      const collection = await collectionService.getCollectionByIdOrSlug(idOrSlug);

      res.status(200).json({
        success: true,
        data: collection,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async createCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const collection = await collectionService.createCollection(req.body);

      res.status(201).json({
        success: true,
        data: collection,
        message: "Collection created successfully.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"]!;
      const collection = await collectionService.updateCollection(id, req.body);

      res.status(200).json({
        success: true,
        data: collection,
        message: "Collection updated successfully.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"]!;
      await collectionService.deleteCollection(id);

      res.status(200).json({
        success: true,
        message: "Collection deleted successfully.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const collectionController = new CollectionController();
