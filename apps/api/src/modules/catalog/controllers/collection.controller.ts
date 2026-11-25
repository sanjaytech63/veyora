import { Request, Response, NextFunction } from "express";
import { collectionService } from "../services/collection.service";
import { CollectionStatus } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

export class CollectionController {
  async listCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status =
        typeof req.query["status"] === "string"
          ? (req.query["status"] as CollectionStatus)
          : undefined;
      const collections = await collectionService.getCollections(status ? { status } : undefined);

      sendSuccess(res, {
        statusCode: 200,
        code: "COLLECTIONS_FETCHED",
        message: "Collections retrieved successfully.",
        data: collections,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = req.params["idOrSlug"]!;
      const collection = await collectionService.getCollectionByIdOrSlug(idOrSlug);

      sendSuccess(res, {
        statusCode: 200,
        code: "COLLECTION_FETCHED",
        message: "Collection details retrieved successfully.",
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const collection = await collectionService.createCollection(req.body);

      sendSuccess(res, {
        statusCode: 201,
        code: "COLLECTION_CREATED",
        message: "Collection created successfully.",
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"]!;
      const collection = await collectionService.updateCollection(id, req.body);

      sendSuccess(res, {
        statusCode: 200,
        code: "COLLECTION_UPDATED",
        message: "Collection updated successfully.",
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"]!;
      await collectionService.deleteCollection(id);

      sendSuccess(res, {
        statusCode: 200,
        code: "COLLECTION_DELETED",
        message: "Collection deleted successfully.",
        data: { message: "Collection deleted successfully.", deleted: true },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const collectionController = new CollectionController();
