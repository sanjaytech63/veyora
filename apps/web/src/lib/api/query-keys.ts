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

export const cartKeys = {
  all: ["cart"] as const,
  current: () => ["cart", "current"] as const,
};

export const wishlistKeys = {
  all: ["wishlist"] as const,
  current: () => ["wishlist", "current"] as const,
};

export const addressKeys = {
  all: ["addresses"] as const,
  list: () => ["addresses", "list"] as const,
};

export const checkoutKeys = {
  all: ["checkout"] as const,
  validation: (method?: string) => ["checkout", "validation", method ?? "standard"] as const,
};

export const orderKeys = {
  all: ["orders"] as const,
  list: () => ["orders", "list"] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

export const paymentKeys = {
  all: ["payments"] as const,
  status: (orderId: string) => ["payments", "status", orderId] as const,
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
