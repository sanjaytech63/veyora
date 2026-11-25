import { describe, it, expect, vi, beforeEach } from "vitest";

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock("@/components/ui/sonner", () => ({ toast: toastMocks }));

import { notifyApiError, notifySuccess } from "../lib/notifications";

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
    notifySuccess("Inventory adjusted successfully.");
    expect(toastMocks.success).toHaveBeenCalledWith(
      "Inventory adjusted successfully.",
      expect.objectContaining({ id: expect.stringContaining("success:") })
    );
  });
});
