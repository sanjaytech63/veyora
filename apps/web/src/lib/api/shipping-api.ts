import { apiClient } from "./api-client";
import {
  CalculateShippingPayload,
  CalculateShippingResult,
  ShipmentDto,
} from "@veyora/types";

export const shippingApi = {
  calculateRates: (payload: CalculateShippingPayload): Promise<CalculateShippingResult> =>
    apiClient.post<CalculateShippingResult>("/shipping/calculate-rates", payload),

  trackShipment: (identifier: string): Promise<ShipmentDto> =>
    apiClient.get<ShipmentDto>(`/shipping/track/${identifier}`),

  getOrderShipments: (orderId: string): Promise<ShipmentDto[]> =>
    apiClient.get<ShipmentDto[]>(`/shipping/orders/${orderId}`),
};
