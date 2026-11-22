import { Request, Response, NextFunction } from "express";
import { shippingService } from "../services/shipping.service";
import { ShipmentListQuery } from "@veyora/types";

export class ShippingController {
  /**
   * POST /shipping/calculate-rates
   */
  public async calculateRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await shippingService.calculateRates(req.body);
      res.status(200).json({
        success: true,
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
      res.status(200).json({
        success: true,
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
      res.status(200).json({
        success: true,
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
      res.status(200).json({
        success: true,
        data: result.shipments,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
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
      res.status(200).json({
        success: true,
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
      res.status(201).json({
        success: true,
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
      res.status(200).json({
        success: true,
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
      res.status(200).json({
        success: true,
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
      res.status(201).json({
        success: true,
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
      res.status(200).json({
        success: true,
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
      res.status(201).json({
        success: true,
        message: "Shipping method created successfully",
        data: method,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const shippingController = new ShippingController();
