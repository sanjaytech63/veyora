/**
 * Central catalog of stable, machine-readable API response and error codes for Veyora.
 *
 * These codes remain stable across API versions even if user-facing message copy changes.
 * Frontend and client applications must branch programmatically on these codes rather than
 * parsing human-readable error messages.
 */

export const ApiAuthCode = {
  LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  LOGOUT_SUCCESS: "AUTH_LOGOUT_SUCCESS",
  REGISTER_SUCCESS: "AUTH_REGISTER_SUCCESS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_REVOKED: "SESSION_REVOKED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
} as const;

export const ApiCoreCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  DUPLICATE_REQUEST: "DUPLICATE_REQUEST",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
} as const;

export const ApiCommerceCode = {
  CART_ITEM_ADDED: "CART_ITEM_ADDED",
  CART_ITEM_UPDATED: "CART_ITEM_UPDATED",
  CART_ITEM_REMOVED: "CART_ITEM_REMOVED",
  CART_LOADED: "CART_LOADED",
  CART_CLEARED: "CART_CLEARED",
  COUPON_APPLIED: "COUPON_APPLIED",
  COUPON_INVALID: "COUPON_INVALID",
  COUPON_REMOVED: "COUPON_REMOVED",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  ORDER_NOT_CANCELLABLE: "ORDER_NOT_CANCELLABLE",
} as const;

export const ApiPaymentCode = {
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_VERIFIED: "PAYMENT_VERIFIED",
  PAYMENT_VERIFICATION_FAILED: "PAYMENT_VERIFICATION_FAILED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
} as const;

export const ApiResponseCode = {
  ...ApiAuthCode,
  ...ApiCoreCode,
  ...ApiCommerceCode,
  ...ApiPaymentCode,
} as const;

export type ApiAuthCode = (typeof ApiAuthCode)[keyof typeof ApiAuthCode];
export type ApiCoreCode = (typeof ApiCoreCode)[keyof typeof ApiCoreCode];
export type ApiCommerceCode = (typeof ApiCommerceCode)[keyof typeof ApiCommerceCode];
export type ApiPaymentCode = (typeof ApiPaymentCode)[keyof typeof ApiPaymentCode];
export type ApiResponseCode = (typeof ApiResponseCode)[keyof typeof ApiResponseCode];
