import { Request, Response } from "express";
import { HealthService } from "./health.service";
import { ApiResponseSuccess } from "@veyora/types";

export class HealthController {
  public static check(_req: Request, res: Response): void {
    const health = HealthService.getBasicHealth();
    const response: ApiResponseSuccess<typeof health> = {
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  }

  public static live(_req: Request, res: Response): void {
    res.status(200).json({
      status: "alive",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }

  public static async ready(_req: Request, res: Response): Promise<void> {
    const { isReady, details } = await HealthService.getReadiness();
    const statusCode = isReady ? 200 : 503;
    res.status(statusCode).json(details);
  }
}
