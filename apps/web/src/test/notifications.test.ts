import { describe, it, expect, vi, beforeEach } from "vitest";

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock("@/components/ui/sonner", () => ({ toast: toastMocks }));

import { notifyApiError, notifyApiSuccess, notifySuccess } from "../lib/notifications";

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

  it("uses backend success text without inventing a business message", () => {
    notifySuccess("Profile updated successfully.");
    expect(toastMocks.success).toHaveBeenCalledWith(
      "Profile updated successfully.",
      expect.objectContaining({ id: expect.stringContaining("success:") })
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
});
