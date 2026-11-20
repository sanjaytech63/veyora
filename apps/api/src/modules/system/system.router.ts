import { Router } from "express";
import { SystemController } from "./system.controller";

const router = Router();

router.get("/info", SystemController.getInfo);

export const systemRouter = router;
