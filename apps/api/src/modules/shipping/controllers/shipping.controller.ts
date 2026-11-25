import { Request, Response, NextFunction } from "express";
import { shippingService } from "../services/shipping.service";
import { ShipmentListQuery, ApiShippingCode } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

export class ShippingController {
  /**
   * POST /shipping/calculate-rates
   */
  public async calculateRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await shippingService.calculateRates(req.body);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiShippingCode.SHIPPING_RATES_CALCULATED,
        message: "Shipping rates calculated successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /shipping/track/:identifier
   */
  public async trackShipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier } = req.params;
      const shipment = await shippingService.getShipment(identifier as string);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiShippingCode.SHIPMENT_TRACKED,
        message: "Shipment tracking details retrieved successfully.",
        data: shipment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /shipping/orders/:orderId
   */
  public async getOrderShipments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      const shipments = await shippingService.getShipmentsByOrderId(orderId as string);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiShippingCode.ORDER_SHIPMENTS_FETCHED,
        message: "Order shipments retrieved successfully.",
        data: shipments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/shipments
   */
  public async adminListShipments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await shippingService.listShipments(req.query as unknown as ShipmentListQuery);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiShippingCode.SHIPMENTS_FETCHED,
        message: "Shipments retrieved successfully.",
        data: result.shipments,
        meta: {
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.pages,
            hasNextPage: result.page < result.pages,
            hasPrevPage: result.page > 1,
          },
        },
        extra: {
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.pages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/shipments/:id
   */
  public async adminGetShipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const shipment = await shippingService.getShipment(id as string);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiShippingCode.SHIPMENT_FETCHED,
        message: "Shipment details retrieved successfully.",
        data: shipment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/shipments (Fulfill Order)
   */
  public async adminCreateShipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = req.user
        ? { id: req.user.id, email: req.user.email, role: req.user.role }
        : undefined;
      const shipment = await shippingService.createShipment(req.body, actor);
      sendSuccess(res, {
        statusCode: 201,
        code: ApiShippingCode.SHIPMENT_CREATED,
        message: "Shipment manifested successfully",
        data: shipment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /admin/shipments/:id/tracking
   */
  public async adminUpdateTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const actor = req.user
        ? { id: req.user.id, email: req.user.email, role: req.user.role }
        : undefined;
      const shipment = await shippingService.updateShipmentTracking(id as string, req.body, actor);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiShippingCode.SHIPMENT_TRACKING_UPDATED,
        message: "Shipment tracking updated successfully",
        data: shipment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/shipping/zones
   */
  public async adminListZones(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zones = await shippingService.listZones();
      sendSuccess(res, {
        statusCode: 200,
        code: ApiShippingCode.SHIPPING_ZONES_FETCHED,
        message: "Shipping zones retrieved successfully.",
        data: zones,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/shipping/zones
   */
  public async adminCreateZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zone = await shippingService.createZone(req.body);
      sendSuccess(res, {
        statusCode: 201,
        code: ApiShippingCode.SHIPPING_ZONE_CREATED,
        message: "Shipping zone created successfully",
        data: zone,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/shipping/methods
   */
  public async adminListMethods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { zoneId } = req.query;
      const methods = await shippingService.listMethods(zoneId as string | undefined);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiShippingCode.SHIPPING_METHODS_FETCHED,
        message: "Shipping methods retrieved successfully.",
        data: methods,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/shipping/methods
   */
  public async adminCreateMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const method = await shippingService.createMethod(req.body);
      sendSuccess(res, {
        statusCode: 201,
        code: ApiShippingCode.SHIPPING_METHOD_CREATED,
        message: "Shipping method created successfully",
        data: method,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const shippingController = new ShippingController();
