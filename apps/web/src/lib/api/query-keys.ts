/**
 * TanStack Query Key Factory Conventions
 */

export const systemKeys = {
  all: ["system"] as const,
  health: () => [...systemKeys.all, "health"] as const,
  info: () => [...systemKeys.all, "info"] as const,
};

export const catalogKeys = {
  all: ["catalog"] as const,
  products: (filters?: Record<string, unknown>) =>
    ["catalog", "products", ...(filters ? [filters] : [])] as const,
  product: (slugOrId: string) => ["catalog", "product", slugOrId] as const,
  featured: (limit?: number) => ["catalog", "featured", limit ?? 4] as const,
  related: (id: string, categoryId?: string) =>
    ["catalog", "related", id, categoryId ?? "all"] as const,
  categories: () => ["catalog", "categories"] as const,
  category: (slug: string) => ["catalog", "category", slug] as const,
  brands: () => ["catalog", "brands"] as const,
  search: (query: string) => ["catalog", "search", query] as const,
};

export function createEntityKeyFactory(entityName: string) {
  return {
    all: [entityName] as const,
    lists: () => [entityName, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [entityName, "list", ...(filters ? [filters] : [])] as const,
    details: () => [entityName, "detail"] as const,
    detail: (id: string | number) => [entityName, "detail", String(id)] as const,
  };
}
