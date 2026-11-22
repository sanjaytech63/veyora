import { apiClient } from "./api-client";
import { Product, Category, Brand, CatalogStats } from "@veyora/types";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateBrandInput,
  UpdateBrandInput,
} from "@veyora/validators";

export const adminCatalogApi = {
  // Products
  getProducts: (params?: ProductQueryInput) =>
    apiClient.get<Product[]>("/products", {
      params: params as Record<string, string | number | boolean | undefined | null>,
    }),

  getProduct: (idOrSlug: string) => apiClient.get<Product>(`/products/${idOrSlug}`),

  createProduct: (data: CreateProductInput) => apiClient.post<Product>("/admin/products", data),

  updateProduct: (id: string, data: UpdateProductInput) =>
    apiClient.put<Product>(`/admin/products/${id}`, data),

  deleteProduct: (id: string) => apiClient.delete<{ message: string }>(`/admin/products/${id}`),

  // Categories
  getCategories: () => apiClient.get<Category[]>("/categories"),

  getCategoryTree: () => apiClient.get<Category[]>("/categories/tree"),

  createCategory: (data: CreateCategoryInput) =>
    apiClient.post<Category>("/admin/categories", data),

  updateCategory: (id: string, data: UpdateCategoryInput) =>
    apiClient.put<Category>(`/admin/categories/${id}`, data),

  deleteCategory: (id: string) => apiClient.delete<{ message: string }>(`/admin/categories/${id}`),

  // Brands
  getBrands: () => apiClient.get<Brand[]>("/brands"),

  createBrand: (data: CreateBrandInput) => apiClient.post<Brand>("/admin/brands", data),

  updateBrand: (id: string, data: UpdateBrandInput) =>
    apiClient.put<Brand>(`/admin/brands/${id}`, data),

  deleteBrand: (id: string) => apiClient.delete<{ message: string }>(`/admin/brands/${id}`),

  // Catalog Stats
  getStats: () => apiClient.get<CatalogStats>("/admin/catalog/stats"),
};
