/**
 * Product, Category & Brand Catalog Types for Veyora
 */

export type ProductStatus = "draft" | "active" | "archived";

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  order?: number;
}

export interface ProductVariant {
  id?: string;
  size?: string;
  color?: string;
  sku: string;
  price: number;
  stock: number;
  image?: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  stock: number;
  trackQuantity: boolean;
  status: ProductStatus;
  categoryId: string;
  category?: Category;
  brandId?: string;
  brand?: Brand;
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  seo?: ProductSeo;
  tags: string[];
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type CategoryStatus = "active" | "inactive";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  status: CategoryStatus;
  order: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export type BrandStatus = "active" | "inactive";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  status: BrandStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogStats {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  totalCategories: number;
  totalBrands: number;
}
