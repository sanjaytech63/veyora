import { describe, it, expect, vi, beforeEach } from "vitest";

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock("@/components/ui/sonner", () => ({ toast: toastMocks }));

import { notifyApiError, notifyApiSuccess } from "../lib/notifications";

describe("Admin notification adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes and displays backend-authored errors", () => {
    const normalized = notifyApiError({
      success: false,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this operation.",
      meta: { requestId: "req-admin-123" },
    });

    expect(normalized.code).toBe("FORBIDDEN");
    expect(toastMocks.error).toHaveBeenCalledWith(
      "You do not have permission to perform this operation.",
      expect.objectContaining({ description: "Request ID: req-admin-123" })
    );
  });

  it("uses backend success text", () => {
    expect(
      notifyApiSuccess({
        success: true,
        code: "INVENTORY_ADJUSTED",
        message: "Inventory adjusted successfully.",
        data: { sku: "SKU-1" },
      })
    ).toBe(true);
    expect(toastMocks.success).toHaveBeenCalledWith(
      "Inventory adjusted successfully.",
      expect.objectContaining({ id: expect.stringContaining("success:") })
    );
  });

  it("does not fabricate success for missing backend text", () => {
    expect(notifyApiSuccess({ success: true, data: { id: "record-1" } })).toBe(false);
  });

  it("uses generic fallback for unknown errors", () => {
    notifyApiError({}, "Unable to complete the admin operation.");
    expect(toastMocks.error).toHaveBeenCalledWith(
      "Unable to complete the admin operation.",
      expect.objectContaining({ id: expect.stringContaining("INTERNAL_SERVER_ERROR") })
    );
  });

  it("silences aborted and duplicate errors", () => {
    notifyApiError({ success: false, code: "CLIENT_ABORTED", message: "Aborted" });
    const error = { success: false, code: "INSUFFICIENT_STOCK", message: "Insufficient stock" };
    notifyApiError(error);
    notifyApiError(error);
    expect(toastMocks.error).toHaveBeenCalledTimes(1);
  });
});
