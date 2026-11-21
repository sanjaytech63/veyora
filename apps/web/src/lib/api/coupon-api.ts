import { apiClient } from "./api-client";
import {
  CouponValidationResultDto,
  ValidateCouponPayload,
} from "@veyora/types";

export const couponApi = {
  validateCoupon(payload: ValidateCouponPayload): Promise<CouponValidationResultDto> {
    return apiClient.post<CouponValidationResultDto>("/coupons/validate", payload);
  },
};
