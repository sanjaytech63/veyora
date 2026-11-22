import { Router } from "express";
import { SystemController } from "./system.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import { updateSettingsSchema } from "@veyora/validators";

const router = Router();

router.get("/info", SystemController.getInfo);
router.get("/metrics", SystemController.getMetrics);

// Admin Store Settings
router.get(
  "/admin/settings",
  requireAuth,
  requireRole("admin", "superadmin"),
  SystemController.getSettings
);

router.put(
  "/admin/settings",
  requireAuth,
  requireRole("admin", "superadmin"),
  validate({ body: updateSettingsSchema }),
  SystemController.updateSettings
);

export const systemRouter = router;
