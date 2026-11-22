import { apiClient } from "./api-client";
import {
  ReviewDto,
  AdminReviewQuery,
  PaginatedAdminReviewsDto,
  ModerateReviewPayload,
} from "@veyora/types";

export const adminReviewApi = {
  listReviews: (params?: AdminReviewQuery) =>
    apiClient.get<PaginatedAdminReviewsDto>("/admin/reviews", {
      params: params as Record<string, string | number | boolean | undefined | null>,
    }),

  getReview: (id: string) =>
    apiClient.get<ReviewDto>(`/admin/reviews/${id}`),

  moderateReview: (id: string, payload: ModerateReviewPayload) =>
    apiClient.patch<ReviewDto>(`/admin/reviews/${id}/status`, payload),

  deleteReview: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/admin/reviews/${id}`),
};
