import { Router } from "express";
import { SystemController } from "./system.controller";

const router = Router();

router.get("/info", SystemController.getInfo);
router.get("/metrics", SystemController.getMetrics);

export const systemRouter = router;
