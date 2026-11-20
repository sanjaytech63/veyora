import { Request, Response } from "express";
import { HealthService } from "./health.service";
import { ApiResponseSuccess } from "@veyora/types";

export class HealthController {
  public static check(_req: Request, res: Response): void {
    const health = HealthService.getHealth();
    const response: ApiResponseSuccess<typeof health> = {
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  }
}
