import { useQuery } from "@tanstack/react-query";
import { catalogApi, ProductsResponse } from "@/lib/api/catalog-api";
import { catalogKeys } from "@/lib/api/query-keys";
import { ProductQueryInput, SearchQueryInput } from "@veyora/validators";
import {
  Product,
  Category,
  Brand,
  SearchResponse,
  SearchSuggestionResponse,
} from "@veyora/types";

export function useProducts(params?: Partial<ProductQueryInput>) {
  return useQuery<ProductsResponse>({
    queryKey: catalogKeys.products(params as Record<string, unknown>),
    queryFn: () => catalogApi.getProductsWithMeta(params),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

export function useProduct(slugOrId: string) {
  return useQuery<Product>({
    queryKey: catalogKeys.product(slugOrId),
    queryFn: () => catalogApi.getProduct(slugOrId),
    enabled: Boolean(slugOrId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeaturedProducts(limit = 4) {
  return useQuery<Product[]>({
    queryKey: catalogKeys.featured(limit),
    queryFn: () => catalogApi.getFeaturedProducts(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRelatedProducts(productId: string, categoryId?: string, limit = 4) {
  return useQuery<Product[]>({
    queryKey: catalogKeys.related(productId, categoryId),
    queryFn: () => catalogApi.getRelatedProducts(productId, categoryId, limit),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: catalogKeys.categories(),
    queryFn: () => catalogApi.getCategories(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCategory(slug: string) {
  return useQuery<Category | null>({
    queryKey: catalogKeys.category(slug),
    queryFn: () => catalogApi.getCategoryBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 10,
  });
}

export function useBrands() {
  return useQuery<Brand[]>({
    queryKey: catalogKeys.brands(),
    queryFn: () => catalogApi.getBrands(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSearch(query: string) {
  return useQuery<Product[]>({
    queryKey: catalogKeys.search(query),
    queryFn: () => catalogApi.searchProducts(query),
    enabled: query.trim().length > 1,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSearchCatalog(params?: Partial<SearchQueryInput>) {
  return useQuery<SearchResponse>({
    queryKey: catalogKeys.searchAdvanced(params as Record<string, unknown>),
    queryFn: () => catalogApi.searchCatalog(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSearchSuggestions(query: string) {
  return useQuery<SearchSuggestionResponse>({
    queryKey: catalogKeys.suggestions(query),
    queryFn: () => catalogApi.getSuggestions(query),
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
