/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { FilterQuery } from "mongoose";
import { Product, IProduct } from "../../catalog/models/product.model";
import { Category } from "../../catalog/models/category.model";
import { Brand } from "../../catalog/models/brand.model";
import { catalogCacheService } from "../../catalog/services/catalog-cache.service";
import { SearchQueryInput } from "@veyora/validators";
import { escapeRegex } from "@veyora/utils";
import {
  Product as ProductType,
  SearchResponse,
  SearchFacets,
  SearchSuggestionResponse,
} from "@veyora/types";

export class SearchService {
  /**
   * Helper to serialize Mongoose doc to Product DTO
   */
  private toProductDto(doc: any): ProductType {
    const categoryDoc =
      doc.categoryId && typeof doc.categoryId === "object" ? doc.categoryId : undefined;
    const brandDoc = doc.brandId && typeof doc.brandId === "object" ? doc.brandId : undefined;

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
      trackQuantity: doc.trackQuantity ?? true,
      status: doc.status,
      categoryId: categoryDoc ? categoryDoc._id.toString() : doc.categoryId?.toString() || "",
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
      brandId: brandDoc
        ? brandDoc._id.toString()
        : doc.brandId
          ? doc.brandId.toString()
          : undefined,
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
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Execute full-featured catalog search with relevance, filters, facets, and pagination
   */
  async search(query: SearchQueryInput): Promise<SearchResponse> {
    const cacheKey = `search:${JSON.stringify(query)}`;
    const cached = await catalogCacheService.get<SearchResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const rawTerm = (query.q || query.search || "").trim();
    const filter: FilterQuery<IProduct> = { status: "active" };

    if (query.categoryId) {
      if (mongoose.Types.ObjectId.isValid(query.categoryId)) {
        filter.categoryId = new mongoose.Types.ObjectId(query.categoryId);
      }
    }

    if (query.brandId) {
      if (mongoose.Types.ObjectId.isValid(query.brandId)) {
        filter.brandId = new mongoose.Types.ObjectId(query.brandId);
      }
    }

    if (query.inStock) {
      filter.stock = { $gt: 0 };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice !== undefined) priceFilter.$gte = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter.$lte = query.maxPrice;
      filter.price = priceFilter;
    }

    if (query.minRating !== undefined && query.minRating > 0) {
      filter.averageRating = { $gte: query.minRating };
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    let sortOptions: Record<string, any> = { createdAt: -1 };
    const sortBy = query.sortBy || "relevance";

    if (sortBy === "price_asc") {
      sortOptions = { price: 1, _id: 1 };
    } else if (sortBy === "price_desc") {
      sortOptions = { price: -1, _id: 1 };
    } else if (sortBy === "newest") {
      sortOptions = { createdAt: -1, _id: 1 };
    } else if (sortBy === "rating") {
      sortOptions = { averageRating: -1, reviewCount: -1, _id: 1 };
    } else if (sortBy === "popular") {
      sortOptions = { reviewCount: -1, averageRating: -1, _id: 1 };
    }

    let searchFilter = { ...filter };
    let useTextScore = false;

    if (rawTerm) {
      const safeTerm = escapeRegex(rawTerm);
      // First try text search if relevance sorting is requested
      if (sortBy === "relevance") {
        searchFilter = {
          ...filter,
          $text: { $search: rawTerm },
        };
        useTextScore = true;
      } else {
        searchFilter = {
          ...filter,
          $or: [
            { title: { $regex: safeTerm, $options: "i" } },
            { description: { $regex: safeTerm, $options: "i" } },
            { sku: { $regex: safeTerm, $options: "i" } },
            { tags: { $regex: safeTerm, $options: "i" } },
          ],
        };
      }
    }

    let docs: any[] = [];
    let total = 0;

    if (rawTerm && useTextScore) {
      try {
        const [textDocs, textCount] = await Promise.all([
          Product.find(searchFilter, { score: { $meta: "textScore" } })
            .sort({ score: { $meta: "textScore" }, averageRating: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("categoryId")
            .populate("brandId")
            .lean(),
          Product.countDocuments(searchFilter),
        ]);

        docs = textDocs;
        total = textCount;
      } catch {
        // In case text index is not yet built in test env, fallback to regex
        docs = [];
        total = 0;
      }

      // If text search returned 0 items, fallback to regex/fuzzy search
      if (total === 0) {
        const safeTerm = escapeRegex(rawTerm);
        searchFilter = {
          ...filter,
          $or: [
            { title: { $regex: safeTerm, $options: "i" } },
            { description: { $regex: safeTerm, $options: "i" } },
            { sku: { $regex: safeTerm, $options: "i" } },
            { tags: { $regex: safeTerm, $options: "i" } },
          ],
        };

        const [regexDocs, regexCount] = await Promise.all([
          Product.find(searchFilter)
            .sort({ averageRating: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("categoryId")
            .populate("brandId")
            .lean(),
          Product.countDocuments(searchFilter),
        ]);

        docs = regexDocs;
        total = regexCount;
      }
    } else {
      const [regularDocs, regularCount] = await Promise.all([
        Product.find(searchFilter)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate("categoryId")
          .populate("brandId")
          .lean(),
        Product.countDocuments(searchFilter),
      ]);

      docs = regularDocs;
      total = regularCount;
    }

    const totalPages = Math.ceil(total / limit) || 1;

    // Calculate facets in parallel for search filters UI
    const facets = await this.computeFacets(filter, rawTerm);

    const result: SearchResponse = {
      items: docs.map((doc) => this.toProductDto(doc)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      facets,
      query: rawTerm || undefined,
    };

    // Cache the search response for 2 minutes
    await catalogCacheService.set(cacheKey, result, 120);

    return result;
  }

  /**
   * Compute dynamic search facets across active products matching query
   */
  private async computeFacets(
    baseFilter: FilterQuery<IProduct>,
    rawTerm: string
  ): Promise<SearchFacets> {
    try {
      const facetFilter: any = { ...baseFilter };
      delete facetFilter.categoryId;
      delete facetFilter.brandId;
      delete facetFilter.minPrice;
      delete facetFilter.maxPrice;
      delete facetFilter.inStock;
      delete facetFilter.averageRating;

      if (rawTerm) {
        const safeTerm = escapeRegex(rawTerm);
        facetFilter.$or = [
          { title: { $regex: safeTerm, $options: "i" } },
          { tags: { $regex: safeTerm, $options: "i" } },
          { sku: { $regex: safeTerm, $options: "i" } },
        ];
      }

      const [categoryCounts, brandCounts, priceStats, inStockCount, outOfStockCount] =
        await Promise.all([
          Product.aggregate([
            { $match: facetFilter },
            { $group: { _id: "$categoryId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]),
          Product.aggregate([
            { $match: { ...facetFilter, brandId: { $ne: null } } },
            { $group: { _id: "$brandId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]),
          Product.aggregate([
            { $match: facetFilter },
            {
              $group: {
                _id: null,
                min: { $min: "$price" },
                max: { $max: "$price" },
                avg: { $avg: "$price" },
              },
            },
          ]),
          Product.countDocuments({ ...facetFilter, stock: { $gt: 0 } }),
          Product.countDocuments({ ...facetFilter, stock: { $lte: 0 } }),
        ]);

      // Populate category names
      const categoryIds = categoryCounts.map((c) => c._id).filter(Boolean);
      const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
      const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]));

      // Populate brand names
      const brandIds = brandCounts.map((b) => b._id).filter(Boolean);
      const brands = await Brand.find({ _id: { $in: brandIds } }).lean();
      const brandMap = new Map(brands.map((b) => [b._id.toString(), b]));

      const priceResult = priceStats[0] || { min: 0, max: 0, avg: 0 };

      return {
        categories: categoryCounts
          .map((c) => {
            const cat = categoryMap.get(c._id?.toString());
            return cat
              ? {
                  id: cat._id.toString(),
                  name: cat.name,
                  slug: cat.slug,
                  count: c.count,
                }
              : null;
          })
          .filter(Boolean) as SearchFacets["categories"],
        brands: brandCounts
          .map((b) => {
            const br = brandMap.get(b._id?.toString());
            return br
              ? {
                  id: br._id.toString(),
                  name: br.name,
                  slug: br.slug,
                  count: b.count,
                }
              : null;
          })
          .filter(Boolean) as SearchFacets["brands"],
        price: {
          min: priceResult.min ?? 0,
          max: priceResult.max ?? 0,
          avg: Math.round(priceResult.avg ?? 0),
        },
        inStockCount,
        outOfStockCount,
      };
    } catch {
      return {
        categories: [],
        brands: [],
        price: { min: 0, max: 0 },
        inStockCount: 0,
        outOfStockCount: 0,
      };
    }
  }

  /**
   * Fast autocomplete and search suggestions
   */
  async getSuggestions(q: string, limit = 5): Promise<SearchSuggestionResponse> {
    const trimmed = q.trim();
    if (!trimmed) {
      return { suggestions: [], products: [], categories: [] };
    }

    const cacheKey = `suggestions:${trimmed.toLowerCase()}:${limit}`;
    const cached = await catalogCacheService.get<SearchSuggestionResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const safeTerm = escapeRegex(trimmed);
    const [matchingProducts, matchingCategories] = await Promise.all([
      Product.find(
        {
          status: "active",
          $or: [
            { title: { $regex: safeTerm, $options: "i" } },
            { tags: { $regex: safeTerm, $options: "i" } },
            { sku: { $regex: safeTerm, $options: "i" } },
          ],
        },
        {
          title: 1,
          slug: 1,
          price: 1,
          images: 1,
          categoryId: 1,
        }
      )
        .populate("categoryId", "name slug")
        .limit(limit)
        .lean(),
      Category.find(
        {
          status: "active",
          name: { $regex: safeTerm, $options: "i" },
        },
        { name: 1, slug: 1 }
      )
        .limit(3)
        .lean(),
    ]);

    const suggestions = Array.from(
      new Set([...matchingProducts.map((p) => p.title), ...matchingCategories.map((c) => c.name)])
    ).slice(0, limit);

    const response: SearchSuggestionResponse = {
      suggestions,
      products: matchingProducts.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        price: p.price,
        image: p.images?.[0]?.url,
        categoryName: p.categoryId?.name,
      })),
      categories: matchingCategories.map((c: any) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
      })),
    };

    await catalogCacheService.set(cacheKey, response, 300); // 5 min TTL
    return response;
  }
}

export const searchService = new SearchService();
