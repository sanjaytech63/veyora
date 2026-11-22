import { apiClient } from "./api-client";
import {
  CouponDto,
  PaginatedCouponsDto,
  AdminCouponListQuery,
  CreateCouponPayload,
  UpdateCouponPayload,
  CouponAnalyticsDto,
} from "@veyora/types";

export const adminCouponsApi = {
  listCoupons: (query?: AdminCouponListQuery): Promise<PaginatedCouponsDto> =>
    apiClient.get<PaginatedCouponsDto>("/admin/coupons", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getCoupon: (id: string): Promise<CouponDto> => apiClient.get<CouponDto>(`/admin/coupons/${id}`),

  createCoupon: (payload: CreateCouponPayload): Promise<CouponDto> =>
    apiClient.post<CouponDto>("/admin/coupons", payload),

  updateCoupon: (id: string, payload: UpdateCouponPayload): Promise<CouponDto> =>
    apiClient.put<CouponDto>(`/admin/coupons/${id}`, payload),

  toggleCouponStatus: (id: string): Promise<CouponDto> =>
    apiClient.patch<CouponDto>(`/admin/coupons/${id}/toggle-status`),

  deleteCoupon: (id: string): Promise<void> => apiClient.delete<void>(`/admin/coupons/${id}`),

  getCouponAnalytics: (id: string): Promise<CouponAnalyticsDto> =>
    apiClient.get<CouponAnalyticsDto>(`/admin/coupons/${id}/analytics`),
};
