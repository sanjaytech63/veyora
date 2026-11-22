import { Request, Response, NextFunction } from "express";
import { reviewService } from "../services/review.service";
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

      res.status(201).json({
        success: true,
        data: review,
        message: "Your review has been submitted and is pending moderation.",
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: review,
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: review,
        message: `Review has been successfully ${payload.status}.`,
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: result,
        message: "Review deleted successfully.",
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
