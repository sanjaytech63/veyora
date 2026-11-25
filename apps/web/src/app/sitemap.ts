import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import {
  getCachedProducts,
  getCachedCategories,
  getCachedCollections,
} from "@/lib/cache/catalog-cache";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // Base indexable storefront routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/new-arrivals`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const [products, categories, collections] = await Promise.all([
      getCachedProducts({ limit: 100 }).catch(() => []),
      getCachedCategories().catch(() => []),
      getCachedCollections().catch(() => []),
    ]);

    const collectionRoutes: MetadataRoute.Sitemap = collections.map((col) => ({
      url: `${baseUrl}/collections/${col.slug}`,
      lastModified: col.updatedAt ? new Date(col.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticRoutes, ...collectionRoutes, ...categoryRoutes, ...productRoutes];
  } catch {
    // If backend or cache is unreachable, return indexable static routes safely
    return staticRoutes;
  }
}
