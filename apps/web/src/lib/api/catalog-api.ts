import { apiClient } from "./api-client";
import {
  Product,
  Category,
  Brand,
  PaginationMeta,
  SearchResponse,
  SearchSuggestionResponse,
} from "@veyora/types";
import { ProductQueryInput, SearchQueryInput } from "@veyora/validators";

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
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getProductsWithMeta: async (params?: Partial<ProductQueryInput>): Promise<ProductsResponse> => {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 12;

    try {
      const response = await apiClient.getWithMeta<Product[]>("/products", {
        params: params as Record<string, string | number | boolean | undefined | null>,
      });

      if (response && Array.isArray(response.data)) {
        const meta = response.meta as unknown as PaginationMeta | undefined;
        const total = meta?.total ?? response.data.length;
        const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil(total / limit));
        return {
          items: response.data,
          meta: meta || {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        };
      }

      return {
        items: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    } catch {
      return {
        items: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  },

  getProduct: async (idOrSlug: string): Promise<Product> => {
    const product = await apiClient.get<Product>(`/products/${idOrSlug}`);
    if (product && (product.id || (product as unknown as { _id?: string })._id)) {
      return product;
    }
    throw new Error(`Product "${idOrSlug}" not found`);
  },

  getFeaturedProducts: async (limit = 4): Promise<Product[]> => {
    try {
      const prods = await catalogApi.getProducts({ limit: 12 });
      const featured = prods.filter((p) => p.tags?.includes("featured") || p.status === "active");
      return featured.slice(0, limit);
    } catch {
      return [];
    }
  },

  getRelatedProducts: async (
    productId: string,
    categoryId?: string,
    limit = 4
  ): Promise<Product[]> => {
    try {
      const all = await catalogApi.getProducts({ categoryId, limit: 16 });
      return all
        .filter((p) => p.id !== productId && (p as unknown as { _id?: string })._id !== productId)
        .slice(0, limit);
    } catch {
      return [];
    }
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    if (!query.trim()) return [];
    try {
      return await catalogApi.getProducts({ search: query, limit: 20 });
    } catch {
      return [];
    }
  },

  searchCatalog: async (params?: Partial<SearchQueryInput>): Promise<SearchResponse> => {
    try {
      const response = await apiClient.getWithMeta<Product[]>("/search", {
        params: params as Record<string, string | number | boolean | undefined | null>,
      });
      return {
        items: Array.isArray(response.data) ? response.data : [],
        meta: (response.meta as unknown as PaginationMeta) || {
          total: Array.isArray(response.data) ? response.data.length : 0,
          page: Number(params?.page) || 1,
          limit: Number(params?.limit) || 20,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        facets: (response as unknown as { facets?: SearchResponse["facets"] }).facets,
        query: (response as unknown as { query?: string }).query,
      };
    } catch {
      return {
        items: [],
        meta: {
          total: 0,
          page: Number(params?.page) || 1,
          limit: Number(params?.limit) || 20,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  },

  getSuggestions: async (q: string): Promise<SearchSuggestionResponse> => {
    if (!q.trim()) return { suggestions: [], products: [], categories: [] };
    try {
      const data = await apiClient.get<SearchSuggestionResponse>("/search/suggestions", {
        params: { q },
      });
      return data || { suggestions: [], products: [], categories: [] };
    } catch {
      return { suggestions: [], products: [], categories: [] };
    }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const data = await apiClient.get<Category[]>("/categories");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    try {
      const cats = await catalogApi.getCategories();
      return (
        cats.find(
          (c) => c.slug === slug || c.id === slug || (c as unknown as { _id?: string })._id === slug
        ) || null
      );
    } catch {
      return null;
    }
  },

  getCategoryTree: async (): Promise<Category[]> => {
    try {
      const data = await apiClient.get<Category[]>("/categories/tree");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getBrands: async (): Promise<Brand[]> => {
    try {
      const data = await apiClient.get<Brand[]>("/brands");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getBrand: async (idOrSlug: string): Promise<Brand> => {
    return await apiClient.get<Brand>(`/brands/${idOrSlug}`);
  },
};
