import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { parseSafeError, containsSensitiveData } from "../lib/error-utils";
import RootError from "../app/error";
import CollectionsListLoading from "../app/collections/loading";
import OrderDetailLoading from "../app/orders/[id]/loading";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Task 17 — Web Error & Loading Boundary Hardening", () => {
  describe("parseSafeError Classification & Redaction", () => {
    it("identifies 401 / expired session errors and provides auth remediation", () => {
      const err = new Error("401 Unauthorized: session has expired");
      const info = parseSafeError(err);

      expect(info.isAuthError).toBe(true);
      expect(info.title).toBe("Session Expired");
      expect(info.message).toContain("Please sign in again");
    });

    it("identifies 403 Forbidden errors and provides permission guidance", () => {
      const err = new Error("Access forbidden. Missing required permissions: [orders:write].");
      const info = parseSafeError(err);

      expect(info.isForbidden).toBe(true);
      expect(info.title).toBe("Access Restricted");
      expect(info.message).toContain("permission to access this atelier resource");
    });

    it("identifies network drops and connection timeouts", () => {
      const err = new Error("fetch failed: ECONNREFUSED 127.0.0.1:5000");
      const info = parseSafeError(err);

      expect(info.isNetworkError).toBe(true);
      expect(info.title).toBe("Connection Interrupted");
      expect(info.message).toContain("verify your internet connection");
    });

    it("redacts sensitive database connection strings and secrets", () => {
      const sensitiveMsg =
        "MongoServerError: failed to connect to mongodb+srv://superadmin:SecretPass123@cluster0.mongodb.net";
      expect(containsSensitiveData(sensitiveMsg)).toBe(true);

      const info = parseSafeError(new Error(sensitiveMsg), true);
      expect(info.message).not.toContain("mongodb+srv");
      expect(info.message).not.toContain("SecretPass123");
      expect(info.title).toBe("Something Went Wrong");
    });

    it("redacts JWT access tokens and bearer credentials from error messages", () => {
      const tokenMsg = "Error at Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secretpayload.sig";
      expect(containsSensitiveData(tokenMsg)).toBe(true);

      const info = parseSafeError(new Error(tokenMsg), true);
      expect(info.message).not.toContain("eyJhbGciOi");
      expect(info.message).toContain("unexpected error interrupted this storefront process");
    });
  });

  describe("RootError Boundary UI & Accessibility", () => {
    it("renders dedicated 'Sign In to Atelier' action button on authentication error", () => {
      const resetMock = vi.fn();
      const authError = new Error("401 Unauthorized: token expired");

      render(<RootError error={authError} reset={resetMock} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Session Expired")).toBeInTheDocument();

      const signInLink = screen.getByRole("link", { name: /Sign In to Atelier/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink.getAttribute("href")).toBe("/login");
    });

    it("renders 'Try Again' button with accessible role on recoverable error", () => {
      const resetMock = vi.fn();
      const networkError = new Error("Failed to fetch atelier collection lookbook");

      render(<RootError error={networkError} reset={resetMock} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      const retryBtn = screen.getByRole("button", { name: /Try Again/i });
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(resetMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Route-Specific Skeletons Accessibility & Structure", () => {
    it("renders CollectionsListLoading with role='status' and aria-live='polite'", () => {
      const { container } = render(<CollectionsListLoading />);
      const statusElement = container.querySelector('[role="status"]');

      expect(statusElement).toBeInTheDocument();
      expect(statusElement?.getAttribute("aria-live")).toBe("polite");
      expect(statusElement?.getAttribute("aria-label")).toContain("Loading curated collections");
    });

    it("renders OrderDetailLoading with role='status' and aria-live='polite'", () => {
      const { container } = render(<OrderDetailLoading />);
      const statusElement = container.querySelector('[role="status"]');

      expect(statusElement).toBeInTheDocument();
      expect(statusElement?.getAttribute("aria-live")).toBe("polite");
      expect(statusElement?.getAttribute("aria-label")).toContain("Loading order telemetry");
    });
  });
});
