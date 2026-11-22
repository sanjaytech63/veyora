import { Types } from "mongoose";
import { Review, IReview } from "../models/review.model";
import { Product } from "../../catalog/models/product.model";
import { User } from "../../auth/models/user.model";
import { Order } from "../../checkout/models/order.model";
import {
  ReviewDto,
  ProductRatingSummary,
  PaginatedReviewsDto,
  CreateReviewPayload,
  ModerateReviewPayload,
  AdminReviewQuery,
  AdminReviewStats,
  PaginatedAdminReviewsDto,
  RatingBreakdown,
} from "@veyora/types";
import { NotFoundError, BadRequestError, ConflictError } from "@veyora/utils";
import { logger } from "../../../config/logger";

interface PopulatedReviewUser {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface PopulatedReviewProduct {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  images?: Array<{ url: string; isPrimary?: boolean }>;
}

export class ReviewService {
  /**
   * Helper to transform Mongoose IReview doc to safe ReviewDto
   */
  public toReviewDto(
    doc: IReview,
    userDoc?: PopulatedReviewUser,
    productDoc?: PopulatedReviewProduct
  ): ReviewDto {
    const user = userDoc || (doc.userId as unknown as PopulatedReviewUser);
    const product = productDoc || (doc.productId as unknown as PopulatedReviewProduct);

    const customerName =
      user && (user.firstName || user.lastName)
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
        : "Verified Customer";

    const primaryImage =
      product?.images?.find((img) => img.isPrimary)?.url || product?.images?.[0]?.url;

    return {
      id: doc._id.toString(),
      productId: doc.productId ? doc.productId.toString() : "",
      productTitle: product?.title || "",
      productSlug: product?.slug || "",
      productImage: primaryImage || "",
      userId: doc.userId ? doc.userId.toString() : "",
      customerName,
      customerEmail: user?.email || undefined,
      rating: doc.rating,
      title: doc.title,
      comment: doc.comment,
      status: doc.status,
      rejectionReason: doc.rejectionReason,
      isVerifiedPurchase: Boolean(doc.isVerifiedPurchase),
      orderId: doc.orderId ? doc.orderId.toString() : undefined,
      helpfulCount: doc.helpfulCount || 0,
      moderatedBy: doc.moderatedBy ? doc.moderatedBy.toString() : undefined,
      moderatedAt: doc.moderatedAt ? doc.moderatedAt.toISOString() : undefined,
      createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  /**
   * Submit a new product review (Customer only)
   */
  async createReview(
    userId: string,
    productId: string,
    payload: CreateReviewPayload
  ): Promise<ReviewDto> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestError("Invalid product identifier.");
    }

    const productObjectId = new Types.ObjectId(productId);
    const userObjectId = new Types.ObjectId(userId);

    // 1. Verify target garment exists in the catalog
    const product = await Product.findOne({
      _id: productObjectId,
      status: { $ne: "archived" },
    });
    if (!product) {
      throw new NotFoundError("Product not found or is unavailable for review.");
    }

    // 2. Prevent duplicate reviews per user per product
    const existingReview = await Review.findOne({
      productId: productObjectId,
      userId: userObjectId,
    });
    if (existingReview) {
      throw new ConflictError("You have already submitted a review for this product.");
    }

    // 3. Verified Purchase Foundation
    // Check if the user has a confirmed, shipped, processing, or delivered order containing this product
    const deliveredOrder = await Order.findOne({
      customerId: userObjectId,
      "items.productId": productObjectId,
      status: { $in: ["delivered", "shipped", "processing", "confirmed"] },
    });

    const isVerifiedPurchase = Boolean(deliveredOrder);
    const orderId = deliveredOrder ? deliveredOrder._id : undefined;

    // 4. Create review with default pending moderation status
    const review = await Review.create({
      productId: productObjectId,
      userId: userObjectId,
      rating: payload.rating,
      title: payload.title.trim(),
      comment: payload.comment.trim(),
      status: "pending",
      isVerifiedPurchase,
      orderId,
      helpfulCount: 0,
    });

    logger.info(
      { reviewId: review._id.toString(), productId, userId, isVerifiedPurchase },
      "New product review submitted and queued for moderation."
    );

    // Fetch user for sanitized DTO response
    const user = (await User.findById(
      userObjectId,
      "firstName lastName email"
    ).lean()) as PopulatedReviewUser;

    return this.toReviewDto(review, user, {
      _id: product._id,
      title: product.title,
      slug: product.slug,
      images: product.images,
    });
  }

  /**
   * Recalculate and persist average rating and review count on Product
   */
  async recalculateProductRating(
    productId: string | Types.ObjectId
  ): Promise<ProductRatingSummary> {
    const productObjectId =
      typeof productId === "string" ? new Types.ObjectId(productId) : productId;

    const stats = await Review.aggregate([
      {
        $match: {
          productId: productObjectId,
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const averageRating =
      stats.length > 0 && stats[0].averageRating ? Math.round(stats[0].averageRating * 10) / 10 : 0;
    const reviewCount = stats.length > 0 && stats[0].reviewCount ? stats[0].reviewCount : 0;

    // Update Product document cache
    await Product.findByIdAndUpdate(productObjectId, {
      averageRating,
      reviewCount,
    });

    return this.getProductRatingSummary(productObjectId.toString());
  }

  /**
   * Compute comprehensive product rating summary & star breakdown
   */
  async getProductRatingSummary(productId: string): Promise<ProductRatingSummary> {
    const productObjectId = new Types.ObjectId(productId);

    const breakdownAggregation = await Review.aggregate([
      {
        $match: {
          productId: productObjectId,
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const breakdown: RatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalReviews = 0;
    let sumRating = 0;

    for (const item of breakdownAggregation) {
      const ratingKey = item._id as 1 | 2 | 3 | 4 | 5;
      if (ratingKey >= 1 && ratingKey <= 5) {
        breakdown[ratingKey] = item.count;
        totalReviews += item.count;
        sumRating += ratingKey * item.count;
      }
    }

    const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

    return {
      productId,
      averageRating,
      reviewCount: totalReviews,
      breakdown,
    };
  }

  /**
   * Fetch approved reviews for storefront product details
   */
  async getProductReviews(
    productId: string,
    query: {
      page?: number;
      limit?: number;
      rating?: number;
      sort?: "newest" | "highest" | "lowest" | "most_helpful";
    }
  ): Promise<PaginatedReviewsDto> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestError("Invalid product identifier.");
    }

    const productObjectId = new Types.ObjectId(productId);
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      productId: productObjectId,
      status: "approved",
    };

    if (query.rating && query.rating >= 1 && query.rating <= 5) {
      filter["rating"] = query.rating;
    }

    // Determine sort
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === "highest") {
      sortOptions = { rating: -1, createdAt: -1 };
    } else if (query.sort === "lowest") {
      sortOptions = { rating: 1, createdAt: -1 };
    } else if (query.sort === "most_helpful") {
      sortOptions = { helpfulCount: -1, createdAt: -1 };
    }

    const [reviews, total, summary] = await Promise.all([
      Review.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("userId", "firstName lastName email")
        .lean(),
      Review.countDocuments(filter),
      this.getProductRatingSummary(productId),
    ]);

    const reviewDtos = (reviews as unknown as IReview[]).map((r) => this.toReviewDto(r));

    return {
      reviews: reviewDtos,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * List and search all reviews for Admin Console
   */
  async listAdminReviews(query: AdminReviewQuery): Promise<PaginatedAdminReviewsDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== "all") {
      filter["status"] = query.status;
    }

    if (query.rating && query.rating >= 1 && query.rating <= 5) {
      filter["rating"] = query.rating;
    }

    if (query.productId && Types.ObjectId.isValid(query.productId)) {
      filter["productId"] = new Types.ObjectId(query.productId);
    }

    // Keyword search across customer name, email, or product title
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), "i");

      // Find matching users and products
      const [matchingUsers, matchingProducts] = await Promise.all([
        User.find({
          $or: [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }],
        })
          .select("_id")
          .lean(),
        Product.find({
          title: searchRegex,
        })
          .select("_id")
          .lean(),
      ]);

      const userIds = matchingUsers.map((u) => u._id);
      const productIds = matchingProducts.map((p) => p._id);

      filter["$or"] = [
        { title: searchRegex },
        { comment: searchRegex },
        { userId: { $in: userIds } },
        { productId: { $in: productIds } },
      ];
    }

    const sortField = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [reviews, total, statsAggregation] = await Promise.all([
      Review.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("userId", "firstName lastName email")
        .populate("productId", "title slug images")
        .lean(),
      Review.countDocuments(filter),
      this.getAdminReviewStats(),
    ]);

    const reviewDtos = (reviews as unknown as IReview[]).map((r) => this.toReviewDto(r));

    return {
      reviews: reviewDtos,
      stats: statsAggregation,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Aggregate overall review statistics for the Admin Console
   */
  async getAdminReviewStats(): Promise<AdminReviewStats> {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    let totalReviews = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let ratingSum = 0;
    let ratingItems = 0;

    for (const s of stats) {
      totalReviews += s.count;
      if (s._id === "pending") pendingCount = s.count;
      if (s._id === "approved") {
        approvedCount = s.count;
        if (s.avgRating) {
          ratingSum += s.avgRating * s.count;
          ratingItems += s.count;
        }
      }
      if (s._id === "rejected") rejectedCount = s.count;
    }

    const averageRating = ratingItems > 0 ? Math.round((ratingSum / ratingItems) * 10) / 10 : 0;

    return {
      totalReviews,
      pendingCount,
      approvedCount,
      rejectedCount,
      averageRating,
    };
  }

  /**
   * Get single review by ID
   */
  async getReviewById(id: string): Promise<ReviewDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid review identifier.");
    }

    const review = await Review.findById(id)
      .populate("userId", "firstName lastName email")
      .populate("productId", "title slug images")
      .lean();

    if (!review) {
      throw new NotFoundError("Review not found.");
    }

    return this.toReviewDto(review as unknown as IReview);
  }

  /**
   * Moderate a review: approve, reject, or set pending (Admin only)
   */
  async moderateReview(
    reviewId: string,
    adminId: string,
    payload: ModerateReviewPayload
  ): Promise<ReviewDto> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new BadRequestError("Invalid review identifier.");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found.");
    }

    review.status = payload.status;
    if (payload.status === "rejected") {
      review.rejectionReason =
        payload.rejectionReason || "Does not meet community feedback guidelines";
    } else {
      review.rejectionReason = undefined;
    }

    review.moderatedBy = new Types.ObjectId(adminId);
    review.moderatedAt = new Date();

    await review.save();

    // Recalculate target product's ratings & review counts
    await this.recalculateProductRating(review.productId);

    logger.info(
      { reviewId, status: payload.status, adminId },
      "Review status updated by administrator."
    );

    const populated = await Review.findById(reviewId)
      .populate("userId", "firstName lastName email")
      .populate("productId", "title slug images")
      .lean();

    return this.toReviewDto(populated as unknown as IReview);
  }

  /**
   * Delete a review permanently (Admin only)
   */
  async deleteReview(reviewId: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new BadRequestError("Invalid review identifier.");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found.");
    }

    const productId = review.productId;
    await Review.deleteOne({ _id: review._id });

    // Recalculate ratings
    await this.recalculateProductRating(productId);

    logger.info({ reviewId, productId }, "Review deleted permanently.");

    return { success: true, message: "Review deleted successfully." };
  }

  /**
   * Get reviews submitted by a specific customer
   */
  async getUserReviews(
    userId: string,
    query: { page?: number; limit?: number }
  ): Promise<PaginatedReviewsDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const userObjectId = new Types.ObjectId(userId);

    const [reviews, total] = await Promise.all([
      Review.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("productId", "title slug images")
        .populate("userId", "firstName lastName email")
        .lean(),
      Review.countDocuments({ userId: userObjectId }),
    ]);

    const reviewDtos = (reviews as unknown as IReview[]).map((r) => this.toReviewDto(r));

    return {
      reviews: reviewDtos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Vote a review as helpful
   */
  async markHelpful(reviewId: string): Promise<{ helpfulCount: number }> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new BadRequestError("Invalid review identifier.");
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!review) {
      throw new NotFoundError("Review not found.");
    }

    return { helpfulCount: review.helpfulCount };
  }
}

export const reviewService = new ReviewService();
