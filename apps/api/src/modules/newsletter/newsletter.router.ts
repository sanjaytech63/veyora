import { Router } from "express";
import { validate } from "../../middleware/validate-request";
import { newsletterSubscribeSchema } from "@veyora/validators";
import { newsletterController } from "./controllers/newsletter.controller";
import { newsletterRateLimiter } from "../../middleware/rate-limiter";

const router = Router();

router.post(
  "/newsletter/subscribe",
  newsletterRateLimiter,
  validate({ body: newsletterSubscribeSchema }),
  newsletterController.subscribe.bind(newsletterController)
);

export const newsletterRouter = router;
