/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { ShippingZoneModel } from "../models/shipping-zone.model";
import { ShippingMethodModel, IShippingMethodDoc } from "../models/shipping-method.model";
import { ShipmentModel, IShipmentDoc, IShipmentItem } from "../models/shipment.model";
import { Order } from "../../checkout/models/order.model";
import { providerRegistry } from "../providers/provider-registry";
import {
  ShipmentDto,
  ShipmentStatus,
  CalculateShippingPayload,
  CalculateShippingResult,
  ShippingRateQuote,
  CreateShipmentPayload,
  UpdateShipmentTrackingPayload,
  ShipmentListQuery,
  ShippingZoneDto,
  ShippingMethodDto,
  CreateShippingZonePayload,
  CreateShippingMethodPayload,
} from "@veyora/types";
import { BadRequestError, NotFoundError, ConflictError } from "@veyora/utils";

export class ShippingService {
  /**
   * Seed default luxury shipping zones and methods if database is empty
   */
  public async seedDefaultShippingConfig(): Promise<void> {
    const existingZones = await ShippingZoneModel.countDocuments();
    if (existingZones === 0) {
      const defaultMetro = await ShippingZoneModel.create({
        name: "Metro India",
        code: "IN_METRO",
        description: "Tier-1 Metro Hubs: Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata",
        countries: ["IN"],
        states: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "West Bengal"],
        postalCodes: ["400001", "110001", "560001", "500001", "600001", "700001"],
        isActive: true,
      });

      const defaultRestOfIndia = await ShippingZoneModel.create({
        name: "Rest of India",
        code: "IN_REST",
        description: "All non-metro domestic postal zones and regional territories across India",
        countries: ["IN"],
        states: [],
        postalCodes: [],
        isActive: true,
      });

      await ShippingZoneModel.create({
        name: "International Priority",
        code: "INTERNATIONAL",
        description: "Global delivery to United States, United Kingdom, UAE, and Singapore",
        countries: ["US", "GB", "AE", "SG", "FR"],
        states: [],
        postalCodes: [],
        isActive: true,
      });

      // Seed methods
      await ShippingMethodModel.create([
        {
          zoneId: defaultMetro._id,
          code: "standard",
          name: "Standard Atelier Courier",
          description: "Eco-conscious packaging with tracked ground delivery in 2-4 business days.",
          carrier: "delhivery",
          rate: 150,
          freeShippingThreshold: 1999,
          estimatedDaysMin: 2,
          estimatedDaysMax: 4,
          isActive: true,
        },
        {
          zoneId: defaultMetro._id,
          code: "express",
          name: "Express Priority Air",
          description: "Air freight dispatch directly to your doorstep in 1-2 business days.",
          carrier: "bluedart",
          rate: 350,
          freeShippingThreshold: null,
          estimatedDaysMin: 1,
          estimatedDaysMax: 2,
          isActive: true,
        },
        {
          zoneId: defaultMetro._id,
          code: "white_glove",
          name: "White-Glove Atelier Courier",
          description: "Hand-delivered in garment bag with on-site fitting concierge.",
          carrier: "custom",
          rate: 750,
          freeShippingThreshold: null,
          estimatedDaysMin: 1,
          estimatedDaysMax: 1,
          isActive: true,
        },
        {
          zoneId: defaultRestOfIndia._id,
          code: "standard",
          name: "National Standard Courier",
          description: "Secure domestic ground delivery across India in 3-6 business days.",
          carrier: "delhivery",
          rate: 200,
          freeShippingThreshold: 1999,
          estimatedDaysMin: 3,
          estimatedDaysMax: 6,
          isActive: true,
        },
      ]);
    }
  }

  /**
   * Calculate shipping rates dynamically based on destination and subtotal
   */
  public async calculateRates(payload: CalculateShippingPayload): Promise<CalculateShippingResult> {
    await this.seedDefaultShippingConfig();

    const country = (payload.destinationCountry || "IN").toUpperCase();
    const postalCode = payload.destinationPostalCode?.trim();
    const state = payload.destinationState?.trim();

    // 1. Resolve matching shipping zone
    let matchedZone = await ShippingZoneModel.findOne({
      isActive: true,
      countries: country,
      $or: [
        { postalCodes: postalCode },
        ...(state ? [{ states: new RegExp(`^${state}$`, "i") }] : []),
      ],
    });

    if (!matchedZone) {
      // Fallback: match country zone
      matchedZone = await ShippingZoneModel.findOne({
        isActive: true,
        countries: country,
      });
    }

    if (!matchedZone) {
      // Fallback to any active zone or default
      matchedZone = await ShippingZoneModel.findOne({ isActive: true });
    }

    const zoneName = matchedZone ? matchedZone.name : "Standard Domestic";
    const zoneCode = matchedZone ? matchedZone.code : "IN_DEFAULT";

    // 2. Fetch shipping methods for this zone or global methods
    const query: any = { isActive: true };
    if (matchedZone) {
      query.$or = [{ zoneId: matchedZone._id }, { zoneId: null }];
    }

    let methods: IShippingMethodDoc[] = await ShippingMethodModel.find(query);

    // If no methods found, provide fallback quotes
    if (methods.length === 0) {
      methods = await ShippingMethodModel.find({ isActive: true });
    }

    const quotes: ShippingRateQuote[] = methods.map((method: IShippingMethodDoc) => {
      const isFree =
        method.freeShippingThreshold !== null &&
        method.freeShippingThreshold !== undefined &&
        payload.subtotal >= method.freeShippingThreshold;

      const finalRate = isFree ? 0 : method.rate;

      const estDate = new Date();
      estDate.setDate(estDate.getDate() + method.estimatedDaysMax);

      return {
        methodId: method._id.toString(),
        code: method.code,
        name: method.name,
        description: method.description,
        carrier: method.carrier,
        amount: finalRate,
        originalAmount: method.rate,
        isFree,
        currency: "INR",
        estimatedDaysMin: method.estimatedDaysMin,
        estimatedDaysMax: method.estimatedDaysMax,
        estimatedDeliveryDate: estDate.toISOString().split("T")[0]!,
      };
    });

    return {
      zoneName,
      zoneCode,
      quotes,
    };
  }

  /**
   * Create a new shipment and fulfill an order
   */
  public async createShipment(
    payload: CreateShipmentPayload,
    actor?: { id?: string; email?: string; role?: string }
  ): Promise<ShipmentDto> {
    if (!Types.ObjectId.isValid(payload.orderId)) {
      throw new BadRequestError(`Invalid order ID: ${payload.orderId}`);
    }

    const order = await Order.findById(payload.orderId);
    if (!order) {
      throw new NotFoundError(`Order not found with ID: ${payload.orderId}`);
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      throw new ConflictError(
        `Cannot fulfill order #${order.orderNumber} because its status is '${order.status}'`
      );
    }

    // Determine items to fulfill
    const shipmentItems: IShipmentItem[] = [];

    if (payload.items && payload.items.length > 0) {
      for (const itemInput of payload.items) {
        const orderItem = order.items.find((i: any) => i.id === itemInput.orderItemId);
        if (!orderItem) {
          throw new BadRequestError(
            `Item ${itemInput.orderItemId} does not exist in order #${order.orderNumber}`
          );
        }
        if (itemInput.quantity > orderItem.quantity) {
          throw new BadRequestError(
            `Quantity ${itemInput.quantity} exceeds order item quantity ${orderItem.quantity}`
          );
        }

        shipmentItems.push({
          orderItemId: orderItem.id,
          productId: orderItem.productId,
          variantId: orderItem.variantId,
          title: orderItem.title,
          sku: orderItem.sku,
          quantity: itemInput.quantity,
          price: orderItem.price,
          image: orderItem.image,
        });
      }
    } else {
      // Default: fulfill all items in the order
      for (const i of order.items) {
        shipmentItems.push({
          orderItemId: i.id,
          productId: i.productId,
          variantId: i.variantId,
          title: i.title,
          sku: i.sku,
          quantity: i.quantity,
          price: i.price,
          image: i.image,
        });
      }
    }

    // Provider integration
    const carrierCode = (payload.carrier || "delhivery").toLowerCase();
    const provider = providerRegistry.getProvider(carrierCode);

    const providerResult = await provider.createShipment({
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      shippingAddress: {
        firstName: order.shippingAddress.firstName,
        lastName: order.shippingAddress.lastName,
        street: order.shippingAddress.street,
        apartment: order.shippingAddress.apartment,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone,
      },
      items: shipmentItems.map((i) => ({
        orderItemId: i.orderItemId,
        productId: i.productId.toString(),
        sku: i.sku,
        title: i.title,
        quantity: i.quantity,
        price: i.price,
      })),
      carrier: carrierCode,
      shippingMethod: payload.shippingMethod || order.shippingMethod,
      customTrackingNumber: payload.trackingNumber,
    });

    const shipmentNumber = `SHP-${new Date().getFullYear()}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    const shipment = await ShipmentModel.create({
      shipmentNumber,
      orderId: order._id,
      orderNumber: order.orderNumber,
      trackingNumber: payload.trackingNumber || providerResult.trackingNumber,
      carrier: carrierCode,
      carrierName: payload.carrierName || providerResult.carrierName,
      shippingMethod: payload.shippingMethod || order.shippingMethod || "standard",
      status: "manifested",
      items: shipmentItems,
      shippingAddress: {
        firstName: order.shippingAddress.firstName,
        lastName: order.shippingAddress.lastName,
        street: order.shippingAddress.street,
        apartment: order.shippingAddress.apartment || "",
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone || "",
      },
      trackingUrl: payload.trackingUrl || providerResult.trackingUrl,
      labelUrl: providerResult.labelUrl || "",
      trackingEvents: providerResult.initialEvents.map((e) => ({
        id: e.id,
        status: e.status,
        location: e.location || "",
        description: e.description,
        timestamp: new Date(e.timestamp),
      })),
      shippedAt: new Date(),
      estimatedDeliveryAt: payload.estimatedDeliveryAt
        ? new Date(payload.estimatedDeliveryAt)
        : new Date(providerResult.estimatedDeliveryDate),
      notes: payload.notes || "",
    });

    // Advance Order status to "shipped" if currently pending, confirmed, or processing
    const previousStatus = order.status;
    if (["pending", "confirmed", "processing"].includes(order.status)) {
      order.status = "shipped";
    }

    order.tracking = {
      carrier: payload.carrierName || providerResult.carrierName,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      estimatedDeliveryDate: shipment.estimatedDeliveryAt?.toISOString()?.split("T")[0],
      shippedAt: shipment.shippedAt || new Date(),
    };

    order.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: order.status,
      changedBy: actor?.email || "admin",
      role: actor?.role || "admin",
      reason: `Shipment #${shipment.shipmentNumber} generated via ${shipment.carrierName} (AWB: ${shipment.trackingNumber})`,
      timestamp: new Date(),
    });

    await order.save();

    return this.toShipmentDto(shipment);
  }

  /**
   * Update tracking status and append timeline event
   */
  public async updateShipmentTracking(
    shipmentId: string,
    payload: UpdateShipmentTrackingPayload,
    actor?: { id?: string; email?: string; role?: string }
  ): Promise<ShipmentDto> {
    const shipment = await this.findShipmentByIdOrTracking(shipmentId);
    if (!shipment) {
      throw new NotFoundError(`Shipment not found with ID/AWB: ${shipmentId}`);
    }

    const eventTimestamp = new Date();
    const eventId = randomUUID();

    let desc = payload.description;
    if (!desc) {
      switch (payload.status) {
        case "manifested":
          desc = "Electronic shipping label generated.";
          break;
        case "picked_up":
          desc = "Courier has picked up parcel from atelier.";
          break;
        case "in_transit":
          desc = "Package is in transit between logistics distribution hubs.";
          break;
        case "out_for_delivery":
          desc = "Package is out for delivery with local courier.";
          break;
        case "delivered":
          desc = "Package successfully delivered and signed.";
          break;
        case "failed_delivery":
          desc = "Delivery attempt unsuccessful. Customer unavailable.";
          break;
        case "returned":
          desc = "Package returned to sender.";
          break;
        case "cancelled":
          desc = "Shipment cancelled.";
          break;
        default:
          desc = `Status updated to ${payload.status}`;
      }
    }

    shipment.trackingEvents.push({
      id: eventId,
      status: payload.status,
      location: payload.location || "",
      description: desc,
      timestamp: eventTimestamp,
    });

    shipment.status = payload.status;

    if (payload.trackingNumber) {
      shipment.trackingNumber = payload.trackingNumber;
    }
    if (payload.trackingUrl) {
      shipment.trackingUrl = payload.trackingUrl;
    }
    if (payload.carrier) {
      shipment.carrier = payload.carrier;
    }

    if (payload.status === "delivered") {
      shipment.deliveredAt = eventTimestamp;

      // Update linked order to "delivered"
      const linkedOrder = await Order.findById(shipment.orderId);
      if (linkedOrder && linkedOrder.status === "shipped") {
        const prevOrderStatus = linkedOrder.status;
        linkedOrder.status = "delivered";
        if (linkedOrder.tracking) {
          linkedOrder.tracking.deliveredAt = eventTimestamp;
        }
        linkedOrder.statusHistory.push({
          fromStatus: prevOrderStatus,
          toStatus: "delivered",
          changedBy: actor?.email || "courier-webhook",
          role: actor?.role || "system",
          reason: `Shipment #${shipment.shipmentNumber} delivered successfully`,
          timestamp: eventTimestamp,
        });
        await linkedOrder.save();
      }
    }

    await shipment.save();

    return this.toShipmentDto(shipment);
  }

  /**
   * Get single shipment by ID or Tracking Number
   */
  public async getShipment(identifier: string): Promise<ShipmentDto> {
    const shipment = await this.findShipmentByIdOrTracking(identifier);
    if (!shipment) {
      throw new NotFoundError(`Shipment not found with identifier: ${identifier}`);
    }
    return this.toShipmentDto(shipment);
  }

  /**
   * Get all shipments for a specific order
   */
  public async getShipmentsByOrderId(orderId: string): Promise<ShipmentDto[]> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestError(`Invalid order ID format: ${orderId}`);
    }
    const shipments: IShipmentDoc[] = await ShipmentModel.find({ orderId }).sort({ createdAt: -1 });
    return shipments.map((s: IShipmentDoc) => this.toShipmentDto(s));
  }

  /**
   * List shipments with pagination, filters, and search for Admin
   */
  public async listShipments(query: ShipmentListQuery): Promise<{
    shipments: ShipmentDto[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.carrier) {
      filter.carrier = query.carrier.toLowerCase();
    }

    if (query.orderId) {
      if (Types.ObjectId.isValid(query.orderId)) {
        filter.orderId = query.orderId;
      }
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), "i");
      filter.$or = [
        { trackingNumber: searchRegex },
        { shipmentNumber: searchRegex },
        { orderNumber: searchRegex },
        { "shippingAddress.firstName": searchRegex },
        { "shippingAddress.lastName": searchRegex },
      ];
    }

    const [shipments, total] = await Promise.all([
      ShipmentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ShipmentModel.countDocuments(filter),
    ]);

    return {
      shipments: (shipments as IShipmentDoc[]).map((s) => this.toShipmentDto(s)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Zone management
   */
  public async listZones(): Promise<ShippingZoneDto[]> {
    await this.seedDefaultShippingConfig();
    const zones = await ShippingZoneModel.find().sort({ createdAt: -1 });
    return zones.map((z: any) => ({
      id: z._id.toString(),
      name: z.name,
      code: z.code,
      description: z.description,
      countries: z.countries,
      states: z.states,
      postalCodes: z.postalCodes,
      isActive: z.isActive,
      createdAt: z.createdAt.toISOString(),
      updatedAt: z.updatedAt.toISOString(),
    }));
  }

  public async createZone(payload: CreateShippingZonePayload): Promise<ShippingZoneDto> {
    const existing = await ShippingZoneModel.findOne({ code: payload.code.toUpperCase() });
    if (existing) {
      throw new ConflictError(`Shipping zone with code '${payload.code}' already exists`);
    }

    const zone = await ShippingZoneModel.create({
      name: payload.name,
      code: payload.code.toUpperCase(),
      description: payload.description || "",
      countries: payload.countries.map((c) => c.toUpperCase()),
      states: payload.states || [],
      postalCodes: payload.postalCodes || [],
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    });

    return {
      id: zone._id.toString(),
      name: zone.name,
      code: zone.code,
      description: zone.description,
      countries: zone.countries,
      states: zone.states,
      postalCodes: zone.postalCodes,
      isActive: zone.isActive,
      createdAt: zone.createdAt.toISOString(),
      updatedAt: zone.updatedAt.toISOString(),
    };
  }

  /**
   * Method management
   */
  public async listMethods(zoneId?: string): Promise<ShippingMethodDto[]> {
    await this.seedDefaultShippingConfig();
    const filter: any = {};
    if (zoneId) {
      filter.zoneId = zoneId;
    }
    const methods = await ShippingMethodModel.find(filter).sort({ rate: 1 });
    return methods.map((m: any) => ({
      id: m._id.toString(),
      zoneId: m.zoneId ? m.zoneId.toString() : undefined,
      code: m.code,
      name: m.name,
      description: m.description,
      carrier: m.carrier,
      rate: m.rate,
      freeShippingThreshold: m.freeShippingThreshold,
      estimatedDaysMin: m.estimatedDaysMin,
      estimatedDaysMax: m.estimatedDaysMax,
      isActive: m.isActive,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
  }

  public async createMethod(payload: CreateShippingMethodPayload): Promise<ShippingMethodDto> {
    const method = await ShippingMethodModel.create({
      zoneId: payload.zoneId ? new Types.ObjectId(payload.zoneId) : null,
      code: payload.code.toLowerCase(),
      name: payload.name,
      description: payload.description || "",
      carrier: payload.carrier.toLowerCase(),
      rate: payload.rate,
      freeShippingThreshold: payload.freeShippingThreshold ?? null,
      estimatedDaysMin: payload.estimatedDaysMin,
      estimatedDaysMax: payload.estimatedDaysMax,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    });

    return {
      id: method._id.toString(),
      zoneId: method.zoneId ? method.zoneId.toString() : undefined,
      code: method.code,
      name: method.name,
      description: method.description,
      carrier: method.carrier,
      rate: method.rate,
      freeShippingThreshold: method.freeShippingThreshold,
      estimatedDaysMin: method.estimatedDaysMin,
      estimatedDaysMax: method.estimatedDaysMax,
      isActive: method.isActive,
      createdAt: method.createdAt.toISOString(),
      updatedAt: method.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Map Mongoose document to clean ShipmentDto
   */
  public toShipmentDto(doc: IShipmentDoc): ShipmentDto {
    return {
      id: doc._id.toString(),
      shipmentNumber: doc.shipmentNumber,
      orderId: doc.orderId.toString(),
      orderNumber: doc.orderNumber,
      trackingNumber: doc.trackingNumber,
      carrier: doc.carrier,
      carrierName: doc.carrierName,
      shippingMethod: doc.shippingMethod,
      status: doc.status as ShipmentStatus,
      items: doc.items.map((item) => ({
        orderItemId: item.orderItemId,
        productId: item.productId.toString(),
        variantId: item.variantId ? item.variantId.toString() : undefined,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      })),
      shippingAddress: {
        id: "addr_shipment",
        firstName: doc.shippingAddress.firstName,
        lastName: doc.shippingAddress.lastName,
        street: doc.shippingAddress.street,
        apartment: doc.shippingAddress.apartment,
        city: doc.shippingAddress.city,
        state: doc.shippingAddress.state,
        postalCode: doc.shippingAddress.postalCode,
        country: doc.shippingAddress.country,
        phone: doc.shippingAddress.phone,
        isDefault: false,
      },
      trackingUrl: doc.trackingUrl,
      labelUrl: doc.labelUrl,
      trackingEvents: (doc.trackingEvents || []).map((e) => ({
        id: e.id,
        status: e.status,
        location: e.location,
        description: e.description,
        timestamp: e.timestamp?.toISOString?.() || new Date().toISOString(),
      })),
      shippedAt: doc.shippedAt ? doc.shippedAt.toISOString() : undefined,
      deliveredAt: doc.deliveredAt ? doc.deliveredAt.toISOString() : undefined,
      estimatedDeliveryAt: doc.estimatedDeliveryAt
        ? doc.estimatedDeliveryAt.toISOString()
        : undefined,
      notes: doc.notes || undefined,
      createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  private async findShipmentByIdOrTracking(identifier: string): Promise<IShipmentDoc | null> {
    if (Types.ObjectId.isValid(identifier)) {
      const byId = await ShipmentModel.findById(identifier);
      if (byId) return byId;
    }
    return ShipmentModel.findOne({
      $or: [{ trackingNumber: identifier }, { shipmentNumber: identifier }],
    });
  }
}

export const shippingService = new ShippingService();
