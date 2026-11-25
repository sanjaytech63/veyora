import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { serverCatalog } from "@/lib/api/server-api-client";
import type { Category, Collection, Product } from "@veyora/types";
import type { ProductQueryInput } from "@veyora/validators";

/**
 * Standard Cache Tag Taxonomy for Veyora Storefront Catalog.
 * Used for targeted invalidations via revalidateTag() when administrative mutations occur.
 */
export const CACHE_TAGS = {
  categories: "catalog:categories",
  category: (slug: string) => `catalog:category-slug:${slug}`,
  categoryId: (id: string) => `catalog:category:${id}`,
  collections: "catalog:collections",
  collection: (slug: string) => `catalog:collection-slug:${slug}`,
  collectionId: (id: string) => `catalog:collection:${id}`,
  products: "catalog:products",
  featuredProducts: "catalog:products:featured",
  product: (slug: string) => `catalog:product-slug:${slug}`,
  productId: (id: string) => `catalog:product:${id}`,
  brands: "catalog:brands",
} as const;

/**
 * Fetch all categories cached with the 'taxonomy' profile.
 * Stale: 1 hour | Revalidate: 24 hours | Expire: 7 days
 */
export async function getCachedCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("taxonomy");
  cacheTag(CACHE_TAGS.categories);
  return serverCatalog.getCategories();
}

/**
 * Fetch a single category by slug cached with the 'taxonomy' profile.
 * Stale: 1 hour | Revalidate: 24 hours | Expire: 7 days
 */
export async function getCachedCategoryBySlug(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife("taxonomy");
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.category(slug));
  return serverCatalog.getCategoryBySlug(slug);
}

/**
 * Fetch all published collections cached with the 'lookbook' profile.
 * Stale: 30 minutes | Revalidate: 12 hours | Expire: 3 days
 */
export async function getCachedCollections(): Promise<Collection[]> {
  "use cache";
  cacheLife("lookbook");
  cacheTag(CACHE_TAGS.collections);
  return serverCatalog.getCollections();
}

/**
 * Fetch a single collection by slug cached with the 'lookbook' profile.
 * Stale: 30 minutes | Revalidate: 12 hours | Expire: 3 days
 */
export async function getCachedCollectionBySlug(slug: string): Promise<Collection | null> {
  "use cache";
  cacheLife("lookbook");
  cacheTag(CACHE_TAGS.collections, CACHE_TAGS.collection(slug));
  return serverCatalog.getCollectionBySlug(slug);
}

/**
 * Fetch featured products for storefront showcase cached with the 'showcase' profile.
 * Stale: 10 minutes | Revalidate: 2 hours | Expire: 24 hours
 */
export async function getCachedFeaturedProducts(limit = 4): Promise<Product[]> {
  "use cache";
  cacheLife("showcase");
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.featuredProducts);
  return serverCatalog.getFeaturedProducts(limit);
}

/**
 * Fetch products matching query params cached with the 'garment' profile.
 * Stale: 5 minutes | Revalidate: 1 hour | Expire: 24 hours
 */
export async function getCachedProducts(params?: Partial<ProductQueryInput>): Promise<Product[]> {
  "use cache";
  cacheLife("garment");
  cacheTag(CACHE_TAGS.products);
  return serverCatalog.getProducts(params);
}

/**
 * Fetch a single product by slug cached with the 'garment' profile.
 * Stale: 5 minutes | Revalidate: 1 hour | Expire: 24 hours
 */
export async function getCachedProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("garment");
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.product(slug));
  return serverCatalog.getProductBySlug(slug);
}

/**
 * Invalidation helpers for on-demand cache revalidation.
 * Can be triggered by Webhook endpoints or Admin sync handlers.
 * In Next.js 16, revalidateTag accepts a target tag and cacheLife profile / expiration object.
 */
export async function revalidateProductCache(options: { slug?: string; id?: string }) {
  revalidateTag(CACHE_TAGS.products, "max");
  revalidateTag(CACHE_TAGS.featuredProducts, "max");
  if (options.slug) {
    revalidateTag(CACHE_TAGS.product(options.slug), "max");
  }
  if (options.id) {
    revalidateTag(CACHE_TAGS.productId(options.id), "max");
  }
}

export async function revalidateCategoryCache(options: { slug?: string; id?: string }) {
  revalidateTag(CACHE_TAGS.categories, "max");
  if (options.slug) {
    revalidateTag(CACHE_TAGS.category(options.slug), "max");
  }
  if (options.id) {
    revalidateTag(CACHE_TAGS.categoryId(options.id), "max");
  }
}

export async function revalidateCollectionCache(options: { slug?: string; id?: string }) {
  revalidateTag(CACHE_TAGS.collections, "max");
  if (options.slug) {
    revalidateTag(CACHE_TAGS.collection(options.slug), "max");
  }
  if (options.id) {
    revalidateTag(CACHE_TAGS.collectionId(options.id), "max");
  }
}
