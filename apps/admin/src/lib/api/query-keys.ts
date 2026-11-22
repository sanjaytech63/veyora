/**
 * TanStack Query Key Factory Conventions
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
