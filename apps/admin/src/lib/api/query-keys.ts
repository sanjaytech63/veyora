/**
 * TanStack Query Key Factory Conventions for Veyora Admin
 */

export const systemKeys = {
  all: ["system"] as const,
  health: () => [...systemKeys.all, "health"] as const,
  info: () => [...systemKeys.all, "info"] as const,
};

export const profileKeys = {
  all: ["profile"] as const,
  current: () => ["profile", "current"] as const,
  completion: () => ["profile", "completion"] as const,
};

export const adminAnalyticsKeys = {
  all: ["admin-dashboard"] as const,
  dashboard: (filters?: Record<string, unknown>) =>
    ["admin-dashboard", ...(filters ? [filters] : [])] as const,
};

export const adminOrderKeys = {
  all: ["admin-orders"] as const,
  lists: () => ["admin-orders", "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["admin-orders", ...(filters ? [filters] : [])] as const,
  unfulfilled: () => ["admin-unfulfilled-orders"] as const,
  detail: (id: string) => ["admin-orders", "detail", id] as const,
};

export const adminInventoryKeys = {
  all: ["admin-inventory"] as const,
  lists: () => ["admin-inventory", "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["admin-inventory", ...(filters ? [filters] : [])] as const,
  detail: (id: string) => ["admin-inventory", "detail", id] as const,
};

export const adminShipmentKeys = {
  all: ["admin-shipments"] as const,
  lists: () => ["admin-shipments", "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["admin-shipments", ...(filters ? [filters] : [])] as const,
  detail: (id: string) => ["admin-shipments", "detail", id] as const,
};

export const adminPaymentKeys = {
  all: ["admin-payments"] as const,
  lists: () => ["admin-payments", "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["admin-payments", ...(filters ? [filters] : [])] as const,
  detail: (id: string) => ["admin-payments", "detail", id] as const,
};

export const adminCatalogKeys = {
  all: ["admin-catalog"] as const,
  products: (filters?: Record<string, unknown>) =>
    ["admin-catalog", "products", ...(filters ? [filters] : [])] as const,
  product: (id: string) => ["admin-catalog", "product", id] as const,
  categories: () => ["admin-catalog", "categories"] as const,
  brands: () => ["admin-catalog", "brands"] as const,
  collections: () => ["admin-catalog", "collections"] as const,
};

export const adminCustomerKeys = {
  all: ["admin-customers"] as const,
  lists: () => ["admin-customers", "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["admin-customers", ...(filters ? [filters] : [])] as const,
  detail: (id: string) => ["admin-customers", "detail", id] as const,
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
