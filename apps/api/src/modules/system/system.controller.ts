import { Request, Response } from "express";
import { SystemService } from "./system.service";
import { ApiResponseSuccess } from "@veyora/types";

export class SystemController {
  public static getInfo(_req: Request, res: Response): void {
    const info = SystemService.getSystemInfo();
    const response: ApiResponseSuccess<typeof info> = {
      success: true,
      data: info,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  }

  public static async getMetrics(_req: Request, res: Response): Promise<void> {
    const metrics = await SystemService.getPrometheusMetrics();
    res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    res.status(200).send(metrics);
  }
}
