import { describe, it, expect, vi, beforeEach } from "vitest";

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock("@/components/ui/sonner", () => ({ toast: toastMocks }));

import { notifyApiError, notifyApiSuccess } from "../lib/notifications";
import { ApiClient } from "../lib/api/api-client";

describe("Web notification adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a canonical backend error and preserves its request ID", () => {
    const normalized = notifyApiError({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Please review the submitted information.",
      meta: { requestId: "req-web-123" },
    });

    expect(normalized.code).toBe("VALIDATION_ERROR");
    expect(toastMocks.error).toHaveBeenCalledWith(
      "Please review the submitted information.",
      expect.objectContaining({ description: "Request ID: req-web-123" })
    );
  });

  it("notifies from a canonical success envelope", () => {
    const shown = notifyApiSuccess({
      success: true,
      code: "CART_ITEM_ADDED",
      message: "Item added to your bag.",
      data: { id: "cart-1" },
    });
    expect(shown).toBe(true);
    expect(toastMocks.success).toHaveBeenCalledWith(
      "Item added to your bag.",
      expect.objectContaining({ id: "success:Item added to your bag." })
    );
  });

  it("does not fabricate success for a missing backend message", () => {
    expect(notifyApiSuccess({ success: true, data: { id: "cart-1" } })).toBe(false);
  });

  it("uses a generic fallback without exposing missing error details", () => {
    notifyApiError({}, "Unable to complete payment. Please try again.");
    expect(toastMocks.error).toHaveBeenCalledWith(
      "Unable to complete payment. Please try again.",
      expect.objectContaining({ id: expect.stringContaining("INTERNAL_SERVER_ERROR") })
    );
  });

  it("does not notify for aborted client requests", () => {
    const normalized = notifyApiError({
      success: false,
      code: "CLIENT_ABORTED",
      message: "Request aborted by client",
    });
    expect(normalized.code).toBe("CLIENT_ABORTED");
    expect(toastMocks.error).not.toHaveBeenCalled();
  });

  it("suppresses duplicate errors within the adapter window", () => {
    const error = {
      success: false,
      code: "PAYMENT_FAILED",
      message: "Payment could not be completed.",
    };

    notifyApiError(error);
    notifyApiError(error);

    expect(toastMocks.error).toHaveBeenCalledTimes(1);
  });

  it("requires a backend success message for cart and checkout confirmation", () => {
    expect(
      notifyApiSuccess({
        success: true,
        code: "CART_ITEM_ADDED",
        data: { id: "cart-1" },
      })
    ).toBe(false);

    expect(
      notifyApiSuccess({
        success: true,
        code: "ORDER_PLACED",
        message: "Order placed successfully.",
        data: { id: "order-1" },
      })
    ).toBe(true);
  });

  it("handles payment verification only through backend-confirmed success text", () => {
    expect(
      notifyApiSuccess({
        success: true,
        code: "PAYMENT_PENDING",
        data: { status: "pending" },
      })
    ).toBe(false);

    expect(
      notifyApiSuccess({
        success: true,
        code: "PAYMENT_VERIFIED",
        message: "Payment confirmed and verified.",
        data: { status: "captured" },
      })
    ).toBe(true);
  });

  it("uses stable email-verification codes for authentication behavior", () => {
    const normalized = notifyApiError({
      success: false,
      code: "EMAIL_NOT_VERIFIED",
      message: "Please verify your email address.",
    });

    expect(normalized.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("classifies externally aborted Web requests separately from timeouts", async () => {
    const client = new ApiClient("http://localhost:4000/api/v1");
    const controller = new AbortController();
    controller.abort();

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("The operation was aborted"), { name: "AbortError" })
        )
    );

    await expect(client.get("/orders/test", { signal: controller.signal })).rejects.toMatchObject({
      code: "CLIENT_ABORTED",
      statusCode: 499,
    });

    vi.unstubAllGlobals();
  });
});
