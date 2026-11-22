import mongoose from "mongoose";
import { Collection, ICollection } from "../models/collection.model";
import { CreateCollectionInput, UpdateCollectionInput } from "@veyora/validators";
import { Collection as CollectionType, CollectionStatus } from "@veyora/types";
import { NotFoundError, slugify } from "@veyora/utils";
import { catalogCacheService } from "./catalog-cache.service";

export class CollectionService {
  private toCollectionDto(doc: ICollection): CollectionType {
    return {
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      tagline: doc.tagline || "",
      description: doc.description || "",
      season: doc.season || "",
      image: doc.image || "",
      status: doc.status,
      productCount: doc.productIds?.length || 0,
      productIds: doc.productIds?.map((id) => id.toString()) || [],
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const existing = await Collection.findOne({
        slug,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${count}`;
      count++;
    }
  }

  async createCollection(input: CreateCollectionInput): Promise<CollectionType> {
    const slug = input.slug
      ? await this.generateUniqueSlug(input.slug)
      : await this.generateUniqueSlug(input.name);

    const productObjectIds = (input.productIds || [])
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const collection = await Collection.create({
      name: input.name.trim(),
      slug,
      tagline: input.tagline || "",
      description: input.description || "",
      season: input.season || "",
      image: input.image || "",
      status: input.status || "active",
      productIds: productObjectIds,
    });

    await catalogCacheService.invalidateCatalogCache();
    return this.toCollectionDto(collection);
  }

  async updateCollection(id: string, input: UpdateCollectionInput): Promise<CollectionType> {
    const collection = await Collection.findById(id);
    if (!collection) {
      throw new NotFoundError("Collection not found.");
    }

    if (input.name && input.name.trim() !== collection.name) {
      collection.name = input.name.trim();
    }

    if (input.slug && input.slug.trim() !== collection.slug) {
      collection.slug = await this.generateUniqueSlug(input.slug, id);
    }

    if (input.tagline !== undefined) collection.tagline = input.tagline;
    if (input.description !== undefined) collection.description = input.description;
    if (input.season !== undefined) collection.season = input.season;
    if (input.image !== undefined) collection.image = input.image;
    if (input.status !== undefined) collection.status = input.status;

    if (input.productIds !== undefined) {
      collection.productIds = input.productIds
        .filter((pid) => mongoose.Types.ObjectId.isValid(pid))
        .map((pid) => new mongoose.Types.ObjectId(pid));
    }

    await collection.save();
    await catalogCacheService.invalidateCatalogCache();
    return this.toCollectionDto(collection);
  }

  async deleteCollection(id: string): Promise<void> {
    const collection = await Collection.findById(id);
    if (!collection) {
      throw new NotFoundError("Collection not found.");
    }

    await Collection.deleteOne({ _id: id });
    await catalogCacheService.invalidateCatalogCache();
  }

  async getCollectionByIdOrSlug(idOrSlug: string): Promise<CollectionType> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const collection = await Collection.findOne(
      isObjectId ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug }
    );

    if (!collection) {
      throw new NotFoundError("Collection not found.");
    }

    return this.toCollectionDto(collection);
  }

  async getCollections(options?: { status?: CollectionStatus }): Promise<CollectionType[]> {
    const filter = options?.status ? { status: options.status } : {};
    const collections = await Collection.find(filter).sort({ createdAt: -1 });
    return collections.map((c) => this.toCollectionDto(c));
  }
}

export const collectionService = new CollectionService();
