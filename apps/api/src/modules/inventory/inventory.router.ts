import { Router } from "express";
import { inventoryController } from "./controllers/inventory.controller";
import { validate } from "../../middleware/validate-request";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  adjustStockSchema,
  reserveStockSchema,
  releaseReservationSchema,
  commitReservationSchema,
  updateThresholdSchema,
  inventoryQuerySchema,
} from "@veyora/validators";

const router = Router();

// All Inventory routes are protected administrator endpoints
router.use("/admin/inventory", requireAuth, requireRole("admin", "superadmin"));

// 1. Inventory Summary & Metrics
router.get("/admin/inventory/stats", inventoryController.getStats.bind(inventoryController));

// 2. Low Stock Alerts
router.get("/admin/inventory/low-stock", inventoryController.getLowStock.bind(inventoryController));

// 3. Inventory Listing with Search & Filters
router.get(
  "/admin/inventory",
  validate({ query: inventoryQuerySchema }),
  inventoryController.listInventory.bind(inventoryController)
);

// 4. Single Inventory Item Detail
router.get("/admin/inventory/:skuOrId", inventoryController.getItem.bind(inventoryController));

// 5. Stock Movement Ledger / History
router.get(
  "/admin/inventory/:skuOrId/movements",
  inventoryController.getMovements.bind(inventoryController)
);

// 6. Stock Adjustment (Increase, Decrease, Correction)
router.post(
  "/admin/inventory/adjust",
  validate({ body: adjustStockSchema }),
  inventoryController.adjustStock.bind(inventoryController)
);

// 7. Stock Reservation Foundation
router.post(
  "/admin/inventory/reserve",
  validate({ body: reserveStockSchema }),
  inventoryController.reserveStock.bind(inventoryController)
);

// 8. Release Stock Reservation
router.post(
  "/admin/inventory/release",
  validate({ body: releaseReservationSchema }),
  inventoryController.releaseReservation.bind(inventoryController)
);

// 9. Commit Stock Reservation
router.post(
  "/admin/inventory/commit",
  validate({ body: commitReservationSchema }),
  inventoryController.commitReservation.bind(inventoryController)
);

// 10. Update Low Stock Threshold
router.patch(
  "/admin/inventory/:skuOrId/threshold",
  validate({ body: updateThresholdSchema }),
  inventoryController.updateThreshold.bind(inventoryController)
);

export const inventoryRouter = router;
