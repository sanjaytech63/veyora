import { Router } from "express";
import { shippingController } from "./controllers/shipping.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import {
  calculateShippingSchema,
  createShipmentSchema,
  updateShipmentTrackingSchema,
  shipmentListQuerySchema,
  createShippingZoneSchema,
  createShippingMethodSchema,
} from "@veyora/validators";

const router = Router();

// ==========================================
// STOREFRONT & PUBLIC SHIPPING ROUTES
// ==========================================

// 1. Calculate live shipping rates based on postal code & subtotal
router.post(
  "/shipping/calculate-rates",
  validate({ body: calculateShippingSchema }),
  shippingController.calculateRates.bind(shippingController)
);

// 2. Public Tracking lookup by tracking number, shipment number, or shipment ID
router.get("/shipping/track/:identifier", shippingController.trackShipment.bind(shippingController));

// 3. Order Shipments lookup
router.get("/shipping/orders/:orderId", shippingController.getOrderShipments.bind(shippingController));

// ==========================================
// ADMINISTRATOR SHIPPING & FULFILLMENT ROUTES
// ==========================================
router.use("/admin/shipping", requireAuth, requireRole("admin", "superadmin"));
router.use("/admin/shipments", requireAuth, requireRole("admin", "superadmin"));

// 4. Admin List Shipments
router.get(
  "/admin/shipments",
  validate({ query: shipmentListQuerySchema }),
  shippingController.adminListShipments.bind(shippingController)
);

// 5. Admin Get Single Shipment Detail
router.get("/admin/shipments/:id", shippingController.adminGetShipment.bind(shippingController));

// 6. Admin Create Shipment / Fulfill Order
router.post(
  "/admin/shipments",
  validate({ body: createShipmentSchema }),
  shippingController.adminCreateShipment.bind(shippingController)
);

// 7. Admin Advance Shipment Tracking Status
router.patch(
  "/admin/shipments/:id/tracking",
  validate({ body: updateShipmentTrackingSchema }),
  shippingController.adminUpdateTracking.bind(shippingController)
);

// 8. Admin Shipping Zones
router.get("/admin/shipping/zones", shippingController.adminListZones.bind(shippingController));
router.post(
  "/admin/shipping/zones",
  validate({ body: createShippingZoneSchema }),
  shippingController.adminCreateZone.bind(shippingController)
);

// 9. Admin Shipping Methods
router.get("/admin/shipping/methods", shippingController.adminListMethods.bind(shippingController));
router.post(
  "/admin/shipping/methods",
  validate({ body: createShippingMethodSchema }),
  shippingController.adminCreateMethod.bind(shippingController)
);

export const shippingRouter = router;
