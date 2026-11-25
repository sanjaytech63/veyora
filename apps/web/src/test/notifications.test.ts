import { describe, it, expect, vi, beforeEach } from "vitest";

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock("@/components/ui/sonner", () => ({ toast: toastMocks }));

import { notifyApiError, notifySuccess } from "../lib/notifications";

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
});
