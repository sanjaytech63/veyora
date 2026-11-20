import { Router } from "express";
import { HealthController } from "./health.controller";

const router = Router();

router.get("/", HealthController.check);
router.get("/live", HealthController.live);
router.get("/ready", HealthController.ready);

export const healthRouter = router;
