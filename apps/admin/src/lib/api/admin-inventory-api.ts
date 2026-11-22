import { apiClient } from "./api-client";
import { InventoryItem, StockMovement, InventoryStats } from "@veyora/types";
import {
  AdjustStockInput,
  ReserveStockInput,
  ReleaseReservationInput,
  CommitReservationInput,
  InventoryQueryInput,
  UpdateThresholdInput,
} from "@veyora/validators";

export const adminInventoryApi = {
  getInventory: (params?: Partial<InventoryQueryInput>) =>
    apiClient.get<InventoryItem[]>("/admin/inventory", {
      params: params as Record<string, string | number | boolean | undefined | null>,
    }),

  getStats: () => apiClient.get<InventoryStats>("/admin/inventory/stats"),

  getLowStock: (params?: { page?: number; limit?: number }) =>
    apiClient.get<InventoryItem[]>("/admin/inventory/low-stock", {
      params: params as Record<string, string | number | boolean | undefined | null>,
    }),

  getItem: (skuOrId: string) => apiClient.get<InventoryItem>(`/admin/inventory/${skuOrId}`),

  getMovements: (skuOrId: string, page = 1, limit = 20) =>
    apiClient.get<StockMovement[]>(`/admin/inventory/${skuOrId}/movements`, {
      params: { page, limit },
    }),

  adjustStock: (data: AdjustStockInput) =>
    apiClient.post<InventoryItem>("/admin/inventory/adjust", data),

  reserveStock: (data: ReserveStockInput) =>
    apiClient.post<InventoryItem>("/admin/inventory/reserve", data),

  releaseReservation: (data: ReleaseReservationInput) =>
    apiClient.post<InventoryItem>("/admin/inventory/release", data),

  commitReservation: (data: CommitReservationInput) =>
    apiClient.post<InventoryItem>("/admin/inventory/commit", data),

  updateThreshold: (skuOrId: string, data: UpdateThresholdInput) =>
    apiClient.patch<InventoryItem>(`/admin/inventory/${skuOrId}/threshold`, data),
};
