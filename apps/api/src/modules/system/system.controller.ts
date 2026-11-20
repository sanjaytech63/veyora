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
}
