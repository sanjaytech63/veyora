import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { ValidationError } from "@veyora/utils";
import { ApiErrorDetail } from "@veyora/types";

export interface RequestValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
  headers?: ZodTypeAny;
}

/**
 * Centralized Zod Validation Middleware for Express
 * Validates body, query, params, and headers before controllers execute.
 * Replaces raw request inputs with parsed/transformed and coerced data.
 */
export function validateRequest(schemas: RequestValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params);
        req.params = parsedParams as Record<string, string>;
      }

      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        req.query = parsedQuery as Record<string, string>;
      }

      if (schemas.headers) {
        await schemas.headers.parseAsync(req.headers);
      }

      if (schemas.body) {
        const parsedBody = await schemas.body.parseAsync(req.body);
        req.body = parsedBody;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ApiErrorDetail[] = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        const fieldErrors: Record<string, string[]> = {};
        for (const err of error.errors) {
          const field = err.path.join(".") || "form";
          if (!fieldErrors[field]) {
            fieldErrors[field] = [];
          }
          fieldErrors[field].push(err.message);
        }

        next(new ValidationError("Please review the submitted information.", details, fieldErrors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Reusable shorthand alias
 */
export const validate = validateRequest;
