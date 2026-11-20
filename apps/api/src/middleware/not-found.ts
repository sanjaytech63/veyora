import { Request, Response, NextFunction } from "express";
import { NotFoundError } from "@veyora/utils";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Resource at ${req.method} ${req.originalUrl} was not found`));
}
