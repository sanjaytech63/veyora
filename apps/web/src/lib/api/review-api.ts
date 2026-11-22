import { apiClient } from "./api-client";
import {
  ReviewDto,
  ProductRatingSummary,
  PaginatedReviewsDto,
  CreateReviewPayload,
} from "@veyora/types";
import { ReviewQueryInput } from "@veyora/validators";

export const reviewApi = {
  getProductReviews: (productId: string, query?: Partial<ReviewQueryInput>) =>
    apiClient.get<PaginatedReviewsDto>(`/products/${productId}/reviews`, {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getProductRatingSummary: (productId: string) =>
    apiClient.get<ProductRatingSummary>(`/products/${productId}/reviews/summary`),

  submitReview: (productId: string, payload: CreateReviewPayload) =>
    apiClient.post<ReviewDto>(`/products/${productId}/reviews`, payload),

  markHelpful: (reviewId: string) =>
    apiClient.post<{ helpfulCount: number }>(`/reviews/${reviewId}/helpful`),

  getMyReviews: (query?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedReviewsDto>("/reviews/my-reviews", {
      params: query,
    }),
};
