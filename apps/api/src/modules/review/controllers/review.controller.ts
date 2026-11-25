import { Request, Response, NextFunction } from "express";
import { ApiReviewCode } from "@veyora/types";
import { reviewService } from "../services/review.service";
import { sendSuccess } from "../../../utils/response";
import {
  CreateReviewInput,
  ModerateReviewInput,
  ReviewQueryInput,
  AdminReviewQueryInput,
} from "@veyora/validators";

export class ReviewController {
  /**
   * POST /api/v1/products/:productId/reviews
   * Submit a new customer review (requires authentication)
   */
  async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const productId = req.params["productId"] as string;
      const payload = req.body as CreateReviewInput;

      const review = await reviewService.createReview(userId, productId, payload);

      sendSuccess(res, {
        statusCode: 201,
        code: ApiReviewCode.REVIEW_CREATED,
        message: "Your review has been submitted and is pending moderation.",
        data: review,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/products/:productId/reviews
   * Retrieve approved reviews and rating breakdown for storefront
   */
  async getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params["productId"] as string;
      const query = req.query as unknown as ReviewQueryInput;

      const result = await reviewService.getProductReviews(productId, query);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiReviewCode.REVIEWS_FETCHED,
        message: "Product reviews retrieved successfully.",
        data: result,
        meta: {
          pagination: {
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
            hasNextPage: result.pagination.page < result.pagination.totalPages,
            hasPrevPage: result.pagination.page > 1,
          },
        },
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/products/:productId/reviews/summary
   * Quick summary of average rating and star breakdown
   */
  async getProductRatingSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params["productId"] as string;
      const summary = await reviewService.getProductRatingSummary(productId);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiReviewCode.REVIEW_SUMMARY_FETCHED,
        message: "Product rating summary retrieved successfully.",
        data: summary,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/reviews
   * List, search, and filter all reviews for admin moderation
   */
  async listAdminReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as AdminReviewQueryInput;
      const result = await reviewService.listAdminReviews(query);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiReviewCode.ADMIN_REVIEWS_FETCHED,
        message: "Admin reviews retrieved successfully.",
        data: result,
        meta: {
          pagination: {
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
            hasNextPage: result.pagination.page < result.pagination.totalPages,
            hasPrevPage: result.pagination.page > 1,
          },
        },
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/reviews/:id
   * Get single review by ID
   */
  async getReviewById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const review = await reviewService.getReviewById(id);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiReviewCode.REVIEW_FETCHED,
        message: "Review retrieved successfully.",
        data: review,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/reviews/:id/status
   * Moderate a review: approve or reject
   */
  async moderateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const adminId = req.user!.id;
      const payload = req.body as ModerateReviewInput;

      const review = await reviewService.moderateReview(id, adminId, payload);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiReviewCode.REVIEW_MODERATED,
        message: `Review has been successfully ${payload.status}.`,
        data: review,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/reviews/:id
   * Delete a review permanently
   */
  async deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const result = await reviewService.deleteReview(id);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiReviewCode.REVIEW_DELETED,
        message: "Review deleted successfully.",
        data: result,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reviews/my-reviews
   * Get reviews submitted by the current authenticated customer
   */
  async getUserReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as { page?: number; limit?: number };

      const result = await reviewService.getUserReviews(userId, query);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiReviewCode.CUSTOMER_REVIEWS_FETCHED,
        message: "Customer reviews retrieved successfully.",
        data: result,
        meta: {
          pagination: {
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
            hasNextPage: result.pagination.page < result.pagination.totalPages,
            hasPrevPage: result.pagination.page > 1,
          },
        },
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/reviews/:id/helpful
   * Mark a review as helpful
   */
  async markHelpful(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const result = await reviewService.markHelpful(id);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiReviewCode.REVIEW_HELPFUL_RECORDED,
        message: "Review marked as helpful.",
        data: result,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
