import { Product, IProduct } from "../models/product.model";
import { Category } from "../models/category.model";
import { Brand } from "../models/brand.model";
import { CreateProductInput, UpdateProductInput, ProductQueryInput } from "@veyora/validators";
import { Product as ProductType, Category as CategoryType, Brand as BrandType, CatalogStats } from "@veyora/types";
import { ConflictError, NotFoundError, slugify } from "@veyora/utils";
import mongoose from "mongoose";

export interface PaginatedProducts {
  items: ProductType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PopulatedCategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  status: CategoryType["status"];
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PopulatedBrand {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  status: BrandType["status"];
  createdAt?: Date;
  updatedAt?: Date;
}

interface PopulatedProductDoc extends IProduct {
  categoryId: mongoose.Types.ObjectId & PopulatedCategory;
  brandId?: (mongoose.Types.ObjectId & PopulatedBrand) | null;
}

export class ProductService {
  private toProductDto(
    doc: IProduct,
    categoryDoc?: PopulatedCategory,
    brandDoc?: PopulatedBrand
  ): ProductType {
    return {
      id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      description: doc.description,
      price: doc.price,
      compareAtPrice: doc.compareAtPrice,
      costPrice: doc.costPrice,
      sku: doc.sku,
      barcode: doc.barcode,
      stock: doc.stock,
      trackQuantity: doc.trackQuantity,
      status: doc.status,
      categoryId: doc.categoryId.toString(),
      category: categoryDoc
        ? {
            id: categoryDoc._id.toString(),
            name: categoryDoc.name,
            slug: categoryDoc.slug,
            description: categoryDoc.description || "",
            status: categoryDoc.status,
            order: categoryDoc.order,
            createdAt: categoryDoc.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: categoryDoc.updatedAt?.toISOString?.() || new Date().toISOString(),
          }
        : undefined,
      brandId: doc.brandId ? doc.brandId.toString() : undefined,
      brand: brandDoc
        ? {
            id: brandDoc._id.toString(),
            name: brandDoc.name,
            slug: brandDoc.slug,
            description: brandDoc.description || "",
            status: brandDoc.status,
            createdAt: brandDoc.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: brandDoc.updatedAt?.toISOString?.() || new Date().toISOString(),
          }
        : undefined,
      images: doc.images || [],
      variants: doc.variants || [],
      attributes: doc.attributes || [],
      seo: doc.seo,
      tags: doc.tags || [],
      averageRating: doc.averageRating || 0,
      reviewCount: doc.reviewCount || 0,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const existing = await Product.findOne({
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

  async ensureSkuUnique(sku: string, excludeId?: string): Promise<void> {
    const existing = await Product.findOne({
      sku: sku.toUpperCase().trim(),
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });

    if (existing) {
      throw new ConflictError(`Product with SKU "${sku}" already exists.`);
    }
  }

  async createProduct(input: CreateProductInput): Promise<ProductType> {
    const category = await Category.findById(input.categoryId);
    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    if (input.brandId) {
      const brand = await Brand.findById(input.brandId);
      if (!brand) {
        throw new NotFoundError("Brand not found.");
      }
    }

    await this.ensureSkuUnique(input.sku);

    // Validate variant SKUs uniqueness
    if (input.variants && input.variants.length > 0) {
      const variantSkus = new Set<string>();
      for (const variant of input.variants) {
        const vSku = variant.sku.toUpperCase().trim();
        if (vSku === input.sku.toUpperCase().trim()) {
          throw new ConflictError(`Variant SKU "${vSku}" cannot match parent product SKU.`);
        }
        if (variantSkus.has(vSku)) {
          throw new ConflictError(`Duplicate variant SKU "${vSku}" in product submission.`);
        }
        variantSkus.add(vSku);
      }
    }

    const slug = input.slug
      ? await this.generateUniqueSlug(input.slug)
      : await this.generateUniqueSlug(input.title);

    const product = await Product.create({
      title: input.title.trim(),
      slug,
      description: input.description.trim(),
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      costPrice: input.costPrice,
      sku: input.sku.toUpperCase().trim(),
      barcode: input.barcode?.trim() || "",
      stock: input.stock ?? 0,
      trackQuantity: input.trackQuantity ?? true,
      status: input.status || "draft",
      categoryId: new mongoose.Types.ObjectId(input.categoryId),
      brandId: input.brandId ? new mongoose.Types.ObjectId(input.brandId) : null,
      images: input.images || [],
      variants: (input.variants || []).map((v) => ({
        ...v,
        stock: v.stock ?? 0,
      })),
      attributes: input.attributes || [],
      seo: input.seo || {},
      tags: input.tags || [],
    });

    return this.toProductDto(product, category);
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<ProductType> {
    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    if (input.categoryId && input.categoryId !== product.categoryId.toString()) {
      const category = await Category.findById(input.categoryId);
      if (!category) {
        throw new NotFoundError("Category not found.");
      }
      product.categoryId = new mongoose.Types.ObjectId(input.categoryId);
    }

    if (input.brandId !== undefined) {
      if (input.brandId) {
        const brand = await Brand.findById(input.brandId);
        if (!brand) {
          throw new NotFoundError("Brand not found.");
        }
        product.brandId = new mongoose.Types.ObjectId(input.brandId);
      } else {
        product.brandId = null;
      }
    }

    if (input.sku && input.sku.toUpperCase().trim() !== product.sku) {
      await this.ensureSkuUnique(input.sku, id);
      product.sku = input.sku.toUpperCase().trim();
    }

    if (input.slug && input.slug !== product.slug) {
      product.slug = await this.generateUniqueSlug(input.slug, id);
    } else if (input.title && !input.slug && input.title !== product.title) {
      product.slug = await this.generateUniqueSlug(input.title, id);
    }

    if (input.title !== undefined) product.title = input.title.trim();
    if (input.description !== undefined) product.description = input.description.trim();
    if (input.price !== undefined) product.price = input.price;
    if (input.compareAtPrice !== undefined) product.compareAtPrice = input.compareAtPrice;
    if (input.costPrice !== undefined) product.costPrice = input.costPrice;
    if (input.barcode !== undefined) product.barcode = input.barcode.trim();
    if (input.stock !== undefined) product.stock = input.stock;
    if (input.trackQuantity !== undefined) product.trackQuantity = input.trackQuantity;
    if (input.status !== undefined) product.status = input.status;
    if (input.images !== undefined) product.images = input.images;
    if (input.variants !== undefined) {
      product.variants = input.variants.map((v) => ({
        ...v,
        stock: v.stock ?? 0,
      })) as unknown as IProduct["variants"];
    }
    if (input.attributes !== undefined) product.attributes = input.attributes;
    if (input.seo !== undefined) product.seo = input.seo;
    if (input.tags !== undefined) product.tags = input.tags;

    await product.save();

    const populated = (await Product.findById(product._id)
      .populate("categoryId")
      .populate("brandId")) as unknown as PopulatedProductDoc | null;

    return this.toProductDto(
      product,
      populated?.categoryId,
      populated?.brandId ?? undefined
    );
  }

  async deleteProduct(id: string, hardDelete = false): Promise<void> {
    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    if (hardDelete) {
      await Product.deleteOne({ _id: id });
    } else {
      product.status = "archived";
      await product.save();
    }
  }

  async getProductByIdOrSlug(idOrSlug: string, allowDraft = false): Promise<ProductType> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const product = (await Product.findOne(query)
      .populate("categoryId")
      .populate("brandId")) as unknown as PopulatedProductDoc | null;

    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    if (!allowDraft && product.status !== "active") {
      throw new NotFoundError("Product not found or not published.");
    }

    return this.toProductDto(product, product.categoryId, product.brandId ?? undefined);
  }

  async getProducts(query: ProductQueryInput, allowDraft = false): Promise<PaginatedProducts> {
    const filter: Record<string, unknown> = {};

    if (!allowDraft) {
      filter["status"] = "active";
    } else if (query.status) {
      filter["status"] = query.status;
    }

    if (query.categoryId) {
      filter["categoryId"] = query.categoryId;
    }

    if (query.brandId) {
      filter["brandId"] = query.brandId;
    }

    if (query.tag) {
      filter["tags"] = query.tag;
    }

    if (query.inStock) {
      filter["stock"] = { $gt: 0 };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice !== undefined) priceFilter["$gte"] = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter["$lte"] = query.maxPrice;
      filter["price"] = priceFilter;
    }

    if (query.search) {
      filter["$or"] = [
        { title: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
        { sku: { $regex: query.search, $options: "i" } },
        { tags: { $regex: query.search, $options: "i" } },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const sortField = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("categoryId")
        .populate("brandId") as unknown as Promise<PopulatedProductDoc[]>,
      Product.countDocuments(filter),
    ]);

    return {
      items: products.map((p) =>
        this.toProductDto(p, p.categoryId, p.brandId ?? undefined)
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getCatalogStats(): Promise<CatalogStats> {
    const [
      totalProducts,
      activeProducts,
      draftProducts,
      archivedProducts,
      totalCategories,
      totalBrands,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "draft" }),
      Product.countDocuments({ status: "archived" }),
      Category.countDocuments(),
      Brand.countDocuments(),
    ]);

    return {
      totalProducts,
      activeProducts,
      draftProducts,
      archivedProducts,
      totalCategories,
      totalBrands,
    };
  }
}

export const productService = new ProductService();
