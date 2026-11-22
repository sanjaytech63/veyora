import { apiClient } from "./api-client";
import {
  ShipmentDto,
  ShipmentListQuery,
  CreateShipmentPayload,
  UpdateShipmentTrackingPayload,
  ShippingZoneDto,
  ShippingMethodDto,
  CreateShippingZonePayload,
  CreateShippingMethodPayload,
} from "@veyora/types";

export interface PaginatedShipmentsResponse {
  data: ShipmentDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const adminShippingApi = {
  listShipments: (query?: ShipmentListQuery): Promise<PaginatedShipmentsResponse> =>
    apiClient.get<PaginatedShipmentsResponse>("/admin/shipments", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getShipment: (id: string): Promise<ShipmentDto> =>
    apiClient.get<ShipmentDto>(`/admin/shipments/${id}`),

  createShipment: (payload: CreateShipmentPayload): Promise<ShipmentDto> =>
    apiClient.post<ShipmentDto>("/admin/shipments", payload),

  updateTracking: (id: string, payload: UpdateShipmentTrackingPayload): Promise<ShipmentDto> =>
    apiClient.patch<ShipmentDto>(`/admin/shipments/${id}/tracking`, payload),

  listZones: (): Promise<ShippingZoneDto[]> =>
    apiClient.get<ShippingZoneDto[]>("/admin/shipping/zones"),

  createZone: (payload: CreateShippingZonePayload): Promise<ShippingZoneDto> =>
    apiClient.post<ShippingZoneDto>("/admin/shipping/zones", payload),

  listMethods: (zoneId?: string): Promise<ShippingMethodDto[]> =>
    apiClient.get<ShippingMethodDto[]>("/admin/shipping/methods", {
      params: zoneId ? { zoneId } : undefined,
    }),

  createMethod: (payload: CreateShippingMethodPayload): Promise<ShippingMethodDto> =>
    apiClient.post<ShippingMethodDto>("/admin/shipping/methods", payload),

  getOrderShipments: (orderId: string): Promise<ShipmentDto[]> =>
    apiClient.get<ShipmentDto[]>(`/shipping/orders/${orderId}`),
};
