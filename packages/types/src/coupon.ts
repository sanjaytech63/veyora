export type DiscountType = "percentage" | "fixed";

export type CouponStatus = "active" | "inactive" | "expired";

export interface CouponAnalyticsSummary {
  totalDiscountGiven: number;
  totalRevenueGenerated: number;
  lastUsedAt?: string;
}

export interface CouponDto {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount?: number;
  startsAt: string;
  expiresAt?: string;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  applicableProducts: string[];
  applicableCategories: string[];
  excludedProducts: string[];
  isActive: boolean;
  status: CouponStatus;
  analytics: CouponAnalyticsSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ValidateCouponItem {
  productId: string;
  categoryId?: string;
  price: number;
  quantity: number;
}

export interface ValidateCouponPayload {
  code: string;
  cartTotal?: number;
  items?: ValidateCouponItem[];
}

export interface CouponValidationResultDto {
  isValid: boolean;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  eligibleSubtotal: number;
  minimumOrderAmount: number;
  maxDiscountAmount?: number;
  description?: string;
  message: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maxDiscountAmount?: number | null;
  startsAt?: string | Date;
  expiresAt?: string | Date | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  isActive?: boolean;
}

export type UpdateCouponPayload = Partial<CreateCouponPayload>;

export interface AdminCouponListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | CouponStatus;
  sortBy?: "code" | "createdAt" | "usageCount" | "discountValue";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedCouponsDto {
  items: CouponDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CouponRecentRedemption {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  discountAmount: number;
  orderTotal: number;
  appliedAt: string;
}

export interface CouponAnalyticsDto {
  couponId: string;
  code: string;
  status: CouponStatus;
  usageCount: number;
  usageLimit?: number;
  totalDiscountGiven: number;
  totalRevenueGenerated: number;
  averageOrderValue: number;
  lastUsedAt?: string;
  recentRedemptions: CouponRecentRedemption[];
}
