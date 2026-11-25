import { Brand, IBrand } from "../models/brand.model";
import { Product } from "../models/product.model";
import { CreateBrandInput, UpdateBrandInput } from "@veyora/validators";
import { Brand as BrandType, BrandStatus } from "@veyora/types";
import { ConflictError, NotFoundError, slugify } from "@veyora/utils";
import mongoose from "mongoose";

export class BrandService {
  private toBrandDto(doc: IBrand): BrandType {
    return {
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description || "",
      logo: doc.logo || "",
      website: doc.website || "",
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const existing = await Brand.findOne({
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

  async createBrand(input: CreateBrandInput): Promise<BrandType> {
    const slug = input.slug
      ? await this.generateUniqueSlug(input.slug)
      : await this.generateUniqueSlug(input.name);

    const brand = await Brand.create({
      name: input.name.trim(),
      slug,
      description: input.description || "",
      logo: input.logo || "",
      website: input.website || "",
      status: input.status || "active",
    });

    return this.toBrandDto(brand);
  }

  async updateBrand(id: string, input: UpdateBrandInput): Promise<BrandType> {
    const brand = await Brand.findById(id);
    if (!brand) {
      throw new NotFoundError("Brand not found.", undefined, "BRAND_NOT_FOUND");
    }

    if (input.slug && input.slug !== brand.slug) {
      brand.slug = await this.generateUniqueSlug(input.slug, id);
    } else if (input.name && !input.slug && input.name !== brand.name) {
      brand.slug = await this.generateUniqueSlug(input.name, id);
    }

    if (input.name !== undefined) brand.name = input.name.trim();
    if (input.description !== undefined) brand.description = input.description;
    if (input.logo !== undefined) brand.logo = input.logo;
    if (input.website !== undefined) brand.website = input.website;
    if (input.status !== undefined) brand.status = input.status;

    await brand.save();
    return this.toBrandDto(brand);
  }

  async deleteBrand(id: string): Promise<void> {
    const brand = await Brand.findById(id);
    if (!brand) {
      throw new NotFoundError("Brand not found.", undefined, "BRAND_NOT_FOUND");
    }

    const hasProducts = await Product.exists({ brandId: id });
    if (hasProducts) {
      throw new ConflictError(
        "Cannot delete brand with associated products. Reassign products first.",
        undefined,
        "BRAND_CONFLICT"
      );
    }

    await Brand.deleteOne({ _id: id });
  }

  async getBrandByIdOrSlug(idOrSlug: string): Promise<BrandType> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const brand = await Brand.findOne(
      isObjectId ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug }
    );

    if (!brand) {
      throw new NotFoundError("Brand not found.", undefined, "BRAND_NOT_FOUND");
    }

    return this.toBrandDto(brand);
  }

  async getBrands(options?: { status?: BrandStatus }): Promise<BrandType[]> {
    const filter = options?.status ? { status: options.status } : {};
    const brands = await Brand.find(filter).sort({ name: 1 });
    return brands.map((b) => this.toBrandDto(b));
  }
}

export const brandService = new BrandService();
