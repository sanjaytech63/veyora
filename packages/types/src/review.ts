/**
 * Product Review and Rating Types for Veyora
 */

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewDto {
  id: string;
  productId: string;
  productTitle?: string;
  productSlug?: string;
  productImage?: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  status: ReviewStatus;
  rejectionReason?: string;
  isVerifiedPurchase: boolean;
  orderId?: string;
  helpfulCount: number;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ProductRatingSummary {
  productId: string;
  averageRating: number;
  reviewCount: number;
  breakdown: RatingBreakdown;
}

export interface PaginatedReviewsDto {
  reviews: ReviewDto[];
  summary?: ProductRatingSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateReviewPayload {
  rating: number;
  title: string;
  comment: string;
}

export interface ModerateReviewPayload {
  status: ReviewStatus;
  rejectionReason?: string;
}

export interface AdminReviewQuery {
  page?: number;
  limit?: number;
  status?: "all" | ReviewStatus;
  rating?: number;
  search?: string;
  productId?: string;
  sortBy?: "createdAt" | "rating" | "helpfulCount";
  sortOrder?: "asc" | "desc";
}

export interface AdminReviewStats {
  totalReviews: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  averageRating: number;
}

export interface PaginatedAdminReviewsDto {
  reviews: ReviewDto[];
  stats: AdminReviewStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
