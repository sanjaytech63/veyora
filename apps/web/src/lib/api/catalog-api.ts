import { apiClient } from "./api-client";
import { Product, Category, Brand, PaginationMeta } from "@veyora/types";
import { ProductQueryInput } from "@veyora/validators";
import {
  FALLBACK_PRODUCTS,
  FALLBACK_CATEGORIES,
  FALLBACK_BRANDS,
} from "./catalog-fallback";

export interface ProductsResponse {
  items: Product[];
  meta: PaginationMeta;
}

export const catalogApi = {
  getProducts: async (params?: Partial<ProductQueryInput>): Promise<Product[]> => {
    try {
      const data = await apiClient.get<Product[]>("/products", {
        params: params as Record<string, string | number | boolean | undefined | null>,
      });
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_PRODUCTS;
    } catch {
      return filterFallbackProducts(params);
    }
  },

  getProductsWithMeta: async (params?: Partial<ProductQueryInput>): Promise<ProductsResponse> => {
    try {
      const response = await apiClient.getWithMeta<Product[]>("/products", {
        params: params as Record<string, string | number | boolean | undefined | null>,
      });
      if (response && response.data && response.data.length > 0) {
        const meta = response.meta as unknown as PaginationMeta | undefined;
        const page = Number(params?.page) || 1;
        const limit = Number(params?.limit) || 12;
        const totalPages = Math.ceil(response.data.length / limit) || 1;
        return {
          items: response.data,
          meta: meta || {
            total: response.data.length,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        };
      }
      return paginateFallbackProducts(params);
    } catch {
      return paginateFallbackProducts(params);
    }
  },

  getProduct: async (idOrSlug: string): Promise<Product> => {
    try {
      const product = await apiClient.get<Product>(`/products/${idOrSlug}`);
      if (product && product.slug) return product;
      throw new Error("Product not found");
    } catch {
      const found = FALLBACK_PRODUCTS.find(
        (p) =>
          p.slug === idOrSlug ||
          p.id === idOrSlug ||
          (p as unknown as { _id?: string })._id === idOrSlug ||
          p.sku.toUpperCase() === idOrSlug.toUpperCase()
      );
      if (found) return found;
      throw new Error(`Product "${idOrSlug}" not found`);
    }
  },

  getFeaturedProducts: async (limit = 4): Promise<Product[]> => {
    try {
      const prods = await catalogApi.getProducts({ limit: 12 });
      const featured = prods.filter((p) => p.tags?.includes("featured") || p.status === "active");
      return featured.slice(0, limit);
    } catch {
      return FALLBACK_PRODUCTS.filter((p) => p.tags?.includes("featured")).slice(0, limit);
    }
  },

  getRelatedProducts: async (productId: string, categoryId?: string, limit = 4): Promise<Product[]> => {
    try {
      const all = await catalogApi.getProducts({ limit: 20 });
      return all
        .filter(
          (p) =>
            p.id !== productId &&
            (p as unknown as { _id?: string })._id !== productId &&
            (!categoryId || p.categoryId === categoryId)
        )
        .slice(0, limit);
    } catch {
      return FALLBACK_PRODUCTS.filter(
        (p) =>
          p.id !== productId &&
          (p as unknown as { _id?: string })._id !== productId &&
          (!categoryId || p.categoryId === categoryId)
      ).slice(0, limit);
    }
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    if (!query.trim()) return [];
    try {
      const res = await catalogApi.getProducts({ search: query, limit: 20 });
      return res;
    } catch {
      const q = query.toLowerCase();
      return FALLBACK_PRODUCTS.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const data = await apiClient.get<Category[]>("/categories");
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_CATEGORIES;
    } catch {
      return FALLBACK_CATEGORIES;
    }
  },

  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    try {
      const cats = await catalogApi.getCategories();
      return (
        cats.find(
          (c) =>
            c.slug === slug ||
            c.id === slug ||
            (c as unknown as { _id?: string })._id === slug
        ) || null
      );
    } catch {
      return (
        FALLBACK_CATEGORIES.find(
          (c) =>
            c.slug === slug ||
            c.id === slug ||
            (c as unknown as { _id?: string })._id === slug
        ) || null
      );
    }
  },

  getCategoryTree: async (): Promise<Category[]> => {
    try {
      const data = await apiClient.get<Category[]>("/categories/tree");
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_CATEGORIES;
    } catch {
      return FALLBACK_CATEGORIES;
    }
  },

  getBrands: async (): Promise<Brand[]> => {
    try {
      const data = await apiClient.get<Brand[]>("/brands");
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_BRANDS;
    } catch {
      return FALLBACK_BRANDS;
    }
  },

  getBrand: async (idOrSlug: string): Promise<Brand> => {
    try {
      return await apiClient.get<Brand>(`/brands/${idOrSlug}`);
    } catch {
      const found = FALLBACK_BRANDS.find(
        (b) =>
          b.slug === idOrSlug ||
          b.id === idOrSlug ||
          (b as unknown as { _id?: string })._id === idOrSlug
      );
      if (found) return found;
      throw new Error(`Brand "${idOrSlug}" not found`);
    }
  },
};

function filterFallbackProducts(params?: Partial<ProductQueryInput>): Product[] {
  let list = [...FALLBACK_PRODUCTS];
  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (params?.categoryId && params.categoryId !== "all") {
    list = list.filter((p) => p.categoryId === params.categoryId);
  }
  if (params?.brandId && params.brandId !== "all") {
    list = list.filter((p) => p.brandId === params.brandId);
  }
  if (params?.minPrice !== undefined) {
    list = list.filter((p) => p.price >= (params.minPrice ?? 0));
  }
  if (params?.maxPrice !== undefined) {
    list = list.filter((p) => p.price <= (params.maxPrice ?? Infinity));
  }
  if (params?.sortBy === "price") {
    list.sort((a, b) => (params.sortOrder === "desc" ? b.price - a.price : a.price - b.price));
  } else if (params?.sortBy === "title") {
    list.sort((a, b) => (params.sortOrder === "desc" ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title)));
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return list;
}

function paginateFallbackProducts(params?: Partial<ProductQueryInput>): ProductsResponse {
  const filtered = filterFallbackProducts(params);
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 12;
  const totalPages = Math.ceil(filtered.length / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  return {
    items: paginated,
    meta: {
      total: filtered.length,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
