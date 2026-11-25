import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
  notifyApiError: vi.fn(),
  notifyApiSuccess: vi.fn(),
}));

vi.mock("@/lib/api/newsletter-api", () => ({ newsletterApi: { subscribe: mocks.subscribe } }));
vi.mock("@/lib/notifications", () => ({
  notifyApiError: mocks.notifyApiError,
  notifyApiSuccess: mocks.notifyApiSuccess,
}));

import { FooterNewsletter } from "@/components/navigation/footer/FooterNewsletter";

describe("Footer newsletter subscription", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows success only after the backend confirms and prevents pending duplicate submissions", async () => {
    mocks.subscribe.mockResolvedValue({
      success: true,
      code: "NEWSLETTER_SUBSCRIBED",
      message: "Your newsletter subscription request was received and recorded.",
      data: { accepted: true, status: "pending" },
    });
    mocks.notifyApiSuccess.mockReturnValue(true);

    render(<FooterNewsletter />);
    fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
      target: { value: "patron@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(mocks.subscribe).toHaveBeenCalledTimes(1));
    expect(mocks.notifyApiSuccess).toHaveBeenCalledTimes(1);
  });

  it("does not notify success when the backend response has no success message", async () => {
    mocks.subscribe.mockResolvedValue({ accepted: true, status: "pending" });
    mocks.notifyApiSuccess.mockReturnValue(false);

    render(<FooterNewsletter />);
    fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
      target: { value: "patron@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(mocks.subscribe).toHaveBeenCalledTimes(1));
    expect(mocks.notifyApiSuccess).toHaveBeenCalled();
  });

  it("normalizes backend failures without showing a success notification", async () => {
    mocks.subscribe.mockRejectedValue({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    });
    mocks.notifyApiSuccess.mockReturnValue(false);

    render(<FooterNewsletter />);
    fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
      target: { value: "patron@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(mocks.notifyApiError).toHaveBeenCalledTimes(1));
    expect(mocks.notifyApiSuccess).not.toHaveBeenCalled();
  });
});
