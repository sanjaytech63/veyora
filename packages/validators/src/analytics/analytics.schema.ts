import { z } from "zod";

export const analyticsPeriodEnum = z.enum(["today", "7d", "30d", "90d", "12m", "ytd", "custom"]);

export const dashboardQuerySchema = z.object({
  period: analyticsPeriodEnum.default("30d"),
  startDate: z
    .string()
    .datetime({ message: "startDate must be a valid ISO 8601 string" })
    .optional(),
  endDate: z.string().datetime({ message: "endDate must be a valid ISO 8601 string" }).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
