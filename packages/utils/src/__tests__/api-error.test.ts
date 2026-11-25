import { describe, it, expect } from "vitest";
import {
  isApiSuccessResponse,
  isApiErrorResponse,
  isLegacyApiResponseError,
  isSafeUserFacingMessage,
  extractErrorCode,
  extractErrorMessage,
  extractErrorDetails,
  extractRequestId,
  normalizeApiError,
} from "../api-error";
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponseCode,
  ApiAuthCode,
  ApiCoreCode,
  ApiCommerceCode,
  ApiPaymentCode,
  ApiPaginatedResponse,
} from "@veyora/types";

describe("API Response Contracts and Error Utilities (@veyora/utils)", () => {
  describe("1. Canonical Success Response Type Usage", () => {
    it("recognizes valid canonical ApiSuccessResponse envelope", () => {
      const response: ApiSuccessResponse<{ id: string; name: string }> = {
        success: true,
        code: ApiResponseCode.CART_ITEM_ADDED,
        message: "Garment added to bag",
        data: { id: "item_123", name: "Silk Shirt" },
        meta: {
          requestId: "req_test_01",
          timestamp: new Date().toISOString(),
        },
      };

      expect(isApiSuccessResponse(response)).toBe(true);
      expect(response.success).toBe(true);
      expect(response.code).toBe("CART_ITEM_ADDED");
      expect(response.message).toBe("Garment added to bag");
      expect(response.data.id).toBe("item_123");
    });

    it("supports ApiPaginatedResponse extension", () => {
      const paginated: ApiPaginatedResponse<{ id: string; title: string }> = {
        success: true,
        code: "PRODUCTS_FETCHED",
        message: "Products loaded",
        data: [{ id: "prod_1", title: "Blazer" }],
        meta: {
          requestId: "req_page_01",
          timestamp: "2026-11-25T14:00:00.000Z",
          pagination: {
            page: 1,
            limit: 10,
            total: 50,
            totalPages: 5,
            hasNextPage: true,
            hasPrevPage: false,
          },
        },
      };

      expect(isApiSuccessResponse(paginated)).toBe(true);
      expect(paginated.meta.pagination.totalPages).toBe(5);
      expect(paginated.data).toHaveLength(1);
    });

    it("rejects invalid success envelopes", () => {
      expect(isApiSuccessResponse(null)).toBe(false);
      expect(isApiSuccessResponse(undefined)).toBe(false);
      expect(isApiSuccessResponse({ success: false })).toBe(false);
      expect(isApiSuccessResponse({ success: true, data: {} })).toBe(false); // missing code and message
      expect(isApiSuccessResponse({ success: true, code: "OK" })).toBe(false); // missing data
    });
  });

  describe("2. Canonical Error Response Type Usage", () => {
    it("recognizes valid canonical ApiErrorResponse envelope", () => {
      const errorResponse: ApiErrorResponse = {
        success: false,
        code: ApiResponseCode.INSUFFICIENT_STOCK,
        message: "Selected garment variant is out of stock",
        details: [
          {
            field: "items[0].quantity",
            code: "STOCK_EXCEEDED",
            message: "Only 2 units remaining",
          },
        ],
        meta: {
          requestId: "req_err_01",
          timestamp: new Date().toISOString(),
        },
      };

      expect(isApiErrorResponse(errorResponse)).toBe(true);
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.code).toBe("INSUFFICIENT_STOCK");
      expect(errorResponse.details).toHaveLength(1);
    });

    it("rejects non-canonical error envelopes", () => {
      expect(isApiErrorResponse(null)).toBe(false);
      expect(isApiErrorResponse(undefined)).toBe(false);
      expect(isApiErrorResponse({ success: true })).toBe(false);
      expect(isApiErrorResponse({ success: false })).toBe(false); // missing code and message
    });
  });

  describe("3. Legacy Error Envelope Normalization", () => {
    it("normalizes legacy error format with nested error object", () => {
      const legacyError = {
        success: false,
        error: {
          code: ApiAuthCode.INVALID_CREDENTIALS,
          message: "Invalid email or password",
          details: [{ field: "email", message: "Account not found" }],
        },
        timestamp: "2026-11-25T14:00:00.000Z",
      };

      expect(isLegacyApiResponseError(legacyError)).toBe(true);

      const normalized = normalizeApiError(legacyError);
      expect(normalized.code).toBe("INVALID_CREDENTIALS");
      expect(normalized.message).toBe("Invalid email or password");
      expect(normalized.details).toHaveLength(1);
      expect(normalized.details[0]?.field).toBe("email");
    });

    it("normalizes legacy error format with errors dictionary", () => {
      const legacyValidation = {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Form validation failed",
        },
        errors: {
          email: ["Email must be valid", "Email is required"],
          password: ["Password too short"],
        },
        timestamp: "2026-11-25T14:00:00.000Z",
      };

      const normalized = normalizeApiError(legacyValidation);
      expect(normalized.code).toBe("VALIDATION_FAILED");
      expect(normalized.message).toBe("Form validation failed");
      expect(normalized.details).toHaveLength(3);
      expect(normalized.details.some((d) => d.field === "email")).toBe(true);
      expect(normalized.details.some((d) => d.field === "password")).toBe(true);
    });
  });

  describe("4. Canonical Error Envelope Normalization", () => {
    it("normalizes canonical ApiErrorResponse perfectly", () => {
      const canonicalError: ApiErrorResponse = {
        success: false,
        code: ApiCommerceCode.COUPON_INVALID,
        message: "The coupon code SUMMER20 has expired",
        details: [
          {
            field: "couponCode",
            code: "EXPIRED",
            message: "Coupon expired on 2026-11-01",
          },
        ],
        meta: {
          requestId: "req_coupon_99",
        },
      };

      const normalized = normalizeApiError(canonicalError);
      expect(normalized.code).toBe("COUPON_INVALID");
      expect(normalized.message).toBe("The coupon code SUMMER20 has expired");
      expect(normalized.details).toHaveLength(1);
      expect(normalized.details[0]?.field).toBe("couponCode");
      expect(normalized.requestId).toBe("req_coupon_99");
    });
  });

  describe("5. Nested Validation Detail Extraction", () => {
    it("extracts nested field paths safely", () => {
      const errorWithNestedFields = {
        details: [
          {
            field: "shippingAddress.postalCode",
            code: "invalid_format",
            message: "Invalid postal code format",
          },
          { field: "items[2].size", code: "out_of_stock", message: "Size XL is out of stock" },
        ],
      };

      const details = extractErrorDetails(errorWithNestedFields);
      expect(details).toHaveLength(2);
      expect(details[0]?.field).toBe("shippingAddress.postalCode");
      expect(details[0]?.message).toBe("Invalid postal code format");
      expect(details[1]?.field).toBe("items[2].size");
    });
  });

  describe("6. Request ID Extraction", () => {
    it("extracts requestId from canonical meta.requestId", () => {
      expect(extractRequestId({ meta: { requestId: "req_canonical_123" } })).toBe(
        "req_canonical_123"
      );
    });

    it("extracts requestId from top-level property", () => {
      expect(extractRequestId({ requestId: "req_toplevel_456" })).toBe("req_toplevel_456");
    });

    it("extracts requestId from nested Axios/Fetch response.data.meta", () => {
      const axiosError = {
        response: {
          data: {
            meta: {
              requestId: "req_axios_789",
            },
          },
        },
      };
      expect(extractRequestId(axiosError)).toBe("req_axios_789");
    });

    it("returns undefined when requestId is absent", () => {
      expect(extractRequestId({})).toBeUndefined();
      expect(extractRequestId(null)).toBeUndefined();
      expect(extractRequestId("not an object")).toBeUndefined();
    });
  });

  describe("7. Unknown Error Fallback", () => {
    it("handles null, undefined, and non-error values with safe default fallback", () => {
      const normalizedNull = normalizeApiError(null);
      expect(normalizedNull.code).toBe(ApiCoreCode.INTERNAL_SERVER_ERROR);
      expect(normalizedNull.message).toBe("An unexpected error occurred. Please try again.");
      expect(normalizedNull.details).toEqual([]);

      const normalizedUndefined = normalizeApiError(undefined);
      expect(normalizedUndefined.code).toBe(ApiCoreCode.INTERNAL_SERVER_ERROR);

      const normalizedNumber = normalizeApiError(404);
      expect(normalizedNumber.message).toBe("An unexpected error occurred. Please try again.");
    });

    it("respects custom fallbackMessage parameter", () => {
      const normalized = normalizeApiError({}, "Unable to complete payment transaction");
      expect(normalized.message).toBe("Unable to complete payment transaction");
    });
  });

  describe("8. Network Error Handling", () => {
    it("normalizes fetch/network failure TypeError to NETWORK_ERROR", () => {
      const fetchError = new TypeError("Failed to fetch");
      const normalized = normalizeApiError(fetchError);
      expect(normalized.code).toBe("NETWORK_ERROR");
      expect(normalized.message).toBe(
        "Unable to connect to the server. Please check your network connection."
      );
    });

    it("normalizes AbortError to TIMEOUT", () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      const normalized = normalizeApiError(abortError);
      expect(normalized.code).toBe("TIMEOUT");
      expect(normalized.message).toBe("Request timed out. Please try again.");
    });

    it("maps 408 and 504 status codes to TIMEOUT", () => {
      const timeoutError = { statusCode: 408 };
      expect(extractErrorCode(timeoutError)).toBe("TIMEOUT");

      const gatewayTimeout = { statusCode: 504 };
      expect(extractErrorCode(gatewayTimeout)).toBe("TIMEOUT");
    });
  });

  describe("9. Unsafe Internal Error Suppression", () => {
    it("suppresses MongoDB/Mongoose duplicate key error messages", () => {
      const mongoError = new Error(
        "E11000 duplicate key error collection: veyora.users index: email_1 dup key"
      );
      expect(isSafeUserFacingMessage(mongoError.message)).toBe(false);

      const normalized = normalizeApiError(mongoError);
      expect(normalized.message).toBe("An unexpected error occurred. Please try again.");
      expect(normalized.message).not.toContain("E11000");
      expect(normalized.message).not.toContain("veyora.users");
    });

    it("suppresses raw database connection errors (ECONNREFUSED)", () => {
      const connError = new Error("connect ECONNREFUSED 127.0.0.1:27017");
      expect(isSafeUserFacingMessage(connError.message)).toBe(false);

      const normalized = normalizeApiError(connError);
      expect(normalized.message).not.toContain("127.0.0.1");
      expect(normalized.message).not.toContain("ECONNREFUSED");
    });

    it("suppresses raw file system paths in error messages", () => {
      const pathError = new Error(
        "Cannot open file C:\\Users\\Sanjay\\Desktop\\veyora\\secret.key"
      );
      expect(isSafeUserFacingMessage(pathError.message)).toBe(false);

      const unixPathError = new Error("Cannot open /var/app/secrets/jwt.pem");
      expect(isSafeUserFacingMessage(unixPathError.message)).toBe(false);
    });

    it("suppresses non-operational internal 500 errors", () => {
      const internalErr = {
        statusCode: 500,
        isOperational: false,
        message: "Null pointer reference inside order reconciliation engine",
      };

      const normalized = normalizeApiError(internalErr);
      expect(normalized.message).toBe("An unexpected error occurred. Please try again.");
      expect(normalized.message).not.toContain("Null pointer");
    });
  });

  describe("10. Missing or Malformed Backend Messages", () => {
    it("falls back cleanly when message is an empty string", () => {
      const emptyMsgError = { message: "" };
      expect(extractErrorMessage(emptyMsgError, "Custom fallback")).toBe("Custom fallback");
    });

    it("falls back cleanly when message is not a string", () => {
      const nonStringMsg = { message: { complex: "object" } };
      expect(extractErrorMessage(nonStringMsg, "Custom fallback")).toBe("Custom fallback");
    });

    it("falls back when message exceeds maximum length limit", () => {
      const hugeString = "a".repeat(1000);
      expect(isSafeUserFacingMessage(hugeString)).toBe(false);
    });
  });

  describe("11. Stable Error-Code Extraction", () => {
    it("extracts codes from all defined business domains", () => {
      // Authentication
      expect(extractErrorCode({ code: ApiAuthCode.EMAIL_NOT_VERIFIED })).toBe("EMAIL_NOT_VERIFIED");
      expect(extractErrorCode({ code: ApiAuthCode.SESSION_EXPIRED })).toBe("SESSION_EXPIRED");

      // Commerce
      expect(extractErrorCode({ code: ApiCommerceCode.CART_ITEM_REMOVED })).toBe(
        "CART_ITEM_REMOVED"
      );
      expect(extractErrorCode({ code: ApiCommerceCode.ORDER_PLACED })).toBe("ORDER_PLACED");

      // Payment
      expect(extractErrorCode({ code: ApiPaymentCode.PAYMENT_VERIFIED })).toBe("PAYMENT_VERIFIED");
      expect(extractErrorCode({ code: ApiPaymentCode.PAYMENT_FAILED })).toBe("PAYMENT_FAILED");

      // Core
      expect(extractErrorCode({ code: ApiCoreCode.RATE_LIMIT_EXCEEDED })).toBe(
        "RATE_LIMIT_EXCEEDED"
      );
    });

    it("maps HTTP status codes when no explicit code is provided", () => {
      expect(extractErrorCode({ statusCode: 400 })).toBe(ApiCoreCode.BAD_REQUEST);
      expect(extractErrorCode({ statusCode: 401 })).toBe(ApiCoreCode.UNAUTHORIZED);
      expect(extractErrorCode({ statusCode: 403 })).toBe(ApiCoreCode.FORBIDDEN);
      expect(extractErrorCode({ statusCode: 404 })).toBe(ApiCoreCode.RESOURCE_NOT_FOUND);
      expect(extractErrorCode({ statusCode: 409 })).toBe(ApiCoreCode.CONFLICT);
      expect(extractErrorCode({ statusCode: 422 })).toBe(ApiCoreCode.VALIDATION_ERROR);
      expect(extractErrorCode({ statusCode: 429 })).toBe(ApiCoreCode.RATE_LIMIT_EXCEEDED);
      expect(extractErrorCode({ statusCode: 500 })).toBe(ApiCoreCode.INTERNAL_SERVER_ERROR);
    });
  });

  describe("12. No Accidental Sensitive-Value Exposure", () => {
    it("rejects messages containing bearer tokens, leaked passwords, and OTP values", () => {
      expect(isSafeUserFacingMessage("Error with token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")).toBe(
        false
      );
      expect(isSafeUserFacingMessage("User entered incorrect password='secret123'")).toBe(false);
      expect(isSafeUserFacingMessage("Invalid otp: 554433")).toBe(false);
      expect(isSafeUserFacingMessage("Set-Cookie: session=secret")).toBe(false);
      expect(isSafeUserFacingMessage("Authorization: Bearer my-secret-token-long-value")).toBe(
        false
      );
    });

    it("ensures normalized errors never leak credentials", () => {
      const sensitiveLeak = new Error(
        "Failed to verify Authorization: Bearer abcdef1234567890 for user"
      );
      const normalized = normalizeApiError(sensitiveLeak);
      expect(normalized.message).not.toContain("abcdef1234567890");
      expect(normalized.message).not.toContain("Bearer");
    });
  });
});
