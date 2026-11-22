import { randomUUID } from "node:crypto";
import {
  IShippingProvider,
  ProviderCreateShipmentParams,
  ProviderShipmentResult,
} from "./shipping-provider.interface";
import { CarrierType, ShipmentStatus, TrackingEventDto } from "@veyora/types";

export class MockLogisticsProvider implements IShippingProvider {
  public readonly carrierCode: CarrierType;
  public readonly carrierName: string;

  constructor(code: CarrierType = "delhivery", name: string = "Delhivery Express") {
    this.carrierCode = code;
    this.carrierName = name;
  }

  async createShipment(params: ProviderCreateShipmentParams): Promise<ProviderShipmentResult> {
    const timestamp = new Date().toISOString();
    const trackingNumber =
      params.customTrackingNumber ||
      `VEY-${this.carrierCode.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const trackingUrl = `https://track.veyora.luxury/?carrier=${encodeURIComponent(
      this.carrierCode
    )}&awb=${encodeURIComponent(trackingNumber)}`;

    const estDays = params.shippingMethod === "express" ? 2 : 4;
    const estDelivery = new Date(Date.now() + estDays * 24 * 60 * 60 * 1000).toISOString();

    const initialEvents: TrackingEventDto[] = [
      {
        id: randomUUID(),
        status: "manifested",
        location: "Veyora Central Atelier, Mumbai Hub",
        description: `Electronic shipping manifest created. Shipment assigned to ${this.carrierName}.`,
        timestamp,
      },
    ];

    return {
      trackingNumber,
      trackingUrl,
      carrier: this.carrierCode,
      carrierName: this.carrierName,
      labelUrl: `https://labels.veyora.luxury/shipping/${trackingNumber}.pdf`,
      estimatedDeliveryDate: estDelivery,
      initialEvents,
    };
  }

  async trackShipment(_trackingNumber: string): Promise<{
    status: ShipmentStatus;
    events: TrackingEventDto[];
  }> {
    return {
      status: "in_transit",
      events: [
        {
          id: randomUUID(),
          status: "manifested",
          location: "Veyora Central Atelier, Mumbai Hub",
          description: "Shipment manifest generated.",
          timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        },
        {
          id: randomUUID(),
          status: "picked_up",
          location: "Mumbai Gateway Fulfillment Hub",
          description: "Package received and sorted at origin gateway.",
          timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        },
        {
          id: randomUUID(),
          status: "in_transit",
          location: "Regional Distribution Logistics Centre",
          description: "Package in transit to destination delivery center.",
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  async cancelShipment(trackingNumber: string): Promise<{ success: boolean; message?: string }> {
    return {
      success: true,
      message: `Shipment ${trackingNumber} cancelled with carrier ${this.carrierName}`,
    };
  }
}
