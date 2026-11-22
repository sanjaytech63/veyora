import { z } from "zod";

/**
 * Review Submission Schema for Customers
 */
export const createReviewSchema = z.object({
  rating: z
    .number({ required_error: "Rating is required" })
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5 stars")
    .max(5, "Rating must be between 1 and 5 stars"),
  title: z
    .string({ required_error: "Review title is required" })
    .min(2, "Review title must be at least 2 characters")
    .max(100, "Review title cannot exceed 100 characters")
    .trim(),
  comment: z
    .string({ required_error: "Review comment is required" })
    .min(5, "Review comment must be at least 5 characters")
    .max(2000, "Review comment cannot exceed 2000 characters")
    .trim(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/**
 * Review Moderation Schema for Admins
 */
export const moderateReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "pending"], {
    required_error: "Review status is required",
  }),
  rejectionReason: z
    .string()
    .max(500, "Rejection reason cannot exceed 500 characters")
    .trim()
    .optional(),
});

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;

/**
 * Storefront Review Query Schema
 */
export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(["newest", "highest", "lowest", "most_helpful"]).default("newest"),
});

export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;

/**
 * Admin Review Listing Query Schema
 */
export const adminReviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().max(100).optional(),
  productId: z.string().optional(),
  sortBy: z.enum(["createdAt", "rating", "helpfulCount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type AdminReviewQueryInput = z.infer<typeof adminReviewQuerySchema>;
