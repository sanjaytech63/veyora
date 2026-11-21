import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";

export const adminCustomerListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
  isEmailVerified: z
    .preprocess((val) => {
      if (typeof val === "string") return val.toLowerCase() === "true";
      return val;
    }, z.boolean())
    .optional(),
  sortBy: z.enum(["createdAt", "name", "ordersCount", "totalSpent"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type AdminCustomerListQueryInput = z.input<typeof adminCustomerListQuerySchema>;
export type AdminCustomerListQueryData = z.output<typeof adminCustomerListQuerySchema>;

export const updateCustomerStatusSchema = z.object({
  isActive: z.boolean({ required_error: "isActive is required." }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional(),
});

export type UpdateCustomerStatusInput = z.infer<typeof updateCustomerStatusSchema>;

export const updateCustomerNotesSchema = z.object({
  notes: z.string().trim().max(2000, "Notes cannot exceed 2000 characters."),
});

export type UpdateCustomerNotesInput = z.infer<typeof updateCustomerNotesSchema>;
