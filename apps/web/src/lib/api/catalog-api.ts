import { apiClient } from "./api-client";
import { Product, Category, Brand } from "@veyora/types";
import { ProductQueryInput } from "@veyora/validators";

export const catalogApi = {
  getProducts: (params?: ProductQueryInput) =>
    apiClient.get<Product[]>("/products", {
      params: params as Record<string, string | number | boolean | undefined | null>,
    }),

  getProduct: (idOrSlug: string) =>
    apiClient.get<Product>(`/products/${idOrSlug}`),

  getCategories: () =>
    apiClient.get<Category[]>("/categories"),

  getCategoryTree: () =>
    apiClient.get<Category[]>("/categories/tree"),

  getBrands: () =>
    apiClient.get<Brand[]>("/brands"),

  getBrand: (idOrSlug: string) =>
    apiClient.get<Brand>(`/brands/${idOrSlug}`),
};
