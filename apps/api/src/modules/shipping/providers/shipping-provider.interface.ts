import { CarrierType, ShipmentStatus, TrackingEventDto } from "@veyora/types";

export interface ProviderRateRequest {
  destinationPostalCode: string;
  destinationCountry: string;
  destinationState?: string;
  subtotal: number;
  weightGrams?: number;
}

export interface ProviderCreateShipmentParams {
  orderId: string;
  orderNumber: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  items: Array<{
    orderItemId: string;
    productId: string;
    sku: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  carrier?: string;
  shippingMethod?: string;
  customTrackingNumber?: string;
}

export interface ProviderShipmentResult {
  trackingNumber: string;
  trackingUrl: string;
  carrier: CarrierType | string;
  carrierName: string;
  labelUrl?: string;
  estimatedDeliveryDate: string;
  initialEvents: TrackingEventDto[];
}

export interface IShippingProvider {
  readonly carrierCode: CarrierType | string;
  readonly carrierName: string;

  createShipment(params: ProviderCreateShipmentParams): Promise<ProviderShipmentResult>;
  trackShipment(trackingNumber: string): Promise<{
    status: ShipmentStatus;
    events: TrackingEventDto[];
  }>;
  cancelShipment(trackingNumber: string): Promise<{
    success: boolean;
    message?: string;
  }>;
}
