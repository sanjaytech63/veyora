import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { parseSafeAdminError, containsSensitiveData } from "../lib/error-utils";
import AdminError from "../app/error";
import CustomerDetailLoading from "../app/customers/[id]/loading";
import EditProductLoading from "../app/products/[id]/loading";
import InventoryDetailLoading from "../app/inventory/[id]/loading";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Task 17 — Admin Error & Loading Boundary Hardening", () => {
  describe("parseSafeAdminError Classification & Redaction", () => {
    it("identifies 401 administrative session expirations and provides console login link", () => {
      const err = new Error("401 Unauthorized: Session has expired or was revoked");
      const info = parseSafeAdminError(err);

      expect(info.isAuthError).toBe(true);
      expect(info.title).toBe("Administrative Session Expired");
      expect(info.message).toContain("Please sign in again to continue managing the atelier");
    });

    it("identifies 403 Forbidden administrative privilege errors", () => {
      const err = new Error("Access forbidden. Requires one of the following roles: [superadmin].");
      const info = parseSafeAdminError(err);

      expect(info.isForbidden).toBe(true);
      expect(info.title).toBe("Insufficient Administrative Privileges");
      expect(info.message).toContain("lacks the required permissions");
    });

    it("redacts sensitive database connection strings and passwords in admin console", () => {
      const sensitiveMsg = "Error: password=SecretAdminPass123 at mongodb://127.0.0.1:27017/veyora";
      expect(containsSensitiveData(sensitiveMsg)).toBe(true);

      const info = parseSafeAdminError(new Error(sensitiveMsg), true);
      expect(info.message).not.toContain("SecretAdminPass123");
      expect(info.message).not.toContain("mongodb://");
      expect(info.title).toBe("Administration Console Fault");
    });
  });

  describe("AdminError Boundary UI & Accessibility", () => {
    it("renders 'Sign In to Console' button when authentication is invalid", () => {
      const resetMock = vi.fn();
      const authError = new Error("401 Unauthorized: Session revoked");

      render(<AdminError error={authError} reset={resetMock} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Administrative Session Expired")).toBeInTheDocument();

      const loginLink = screen.getByRole("link", { name: /Sign In to Console/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.getAttribute("href")).toBe("/login");
    });

    it("renders 'Retry Action' on recoverable errors", () => {
      const resetMock = vi.fn();
      const recoverableError = new Error("Failed to load inventory matrix");

      render(<AdminError error={recoverableError} reset={resetMock} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      const retryBtn = screen.getByRole("button", { name: /Retry Action/i });
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(resetMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Admin Detail Route Skeletons Accessibility & Structure", () => {
    it("renders CustomerDetailLoading with role='status' and aria-live='polite'", () => {
      const { container } = render(<CustomerDetailLoading />);
      const statusElement = container.querySelector('[role="status"]');

      expect(statusElement).toBeInTheDocument();
      expect(statusElement?.getAttribute("aria-live")).toBe("polite");
      expect(statusElement?.getAttribute("aria-label")).toContain("Loading customer record");
    });

    it("renders EditProductLoading with role='status' and aria-live='polite'", () => {
      const { container } = render(<EditProductLoading />);
      const statusElement = container.querySelector('[role="status"]');

      expect(statusElement).toBeInTheDocument();
      expect(statusElement?.getAttribute("aria-live")).toBe("polite");
      expect(statusElement?.getAttribute("aria-label")).toContain("Loading garment form");
    });

    it("renders InventoryDetailLoading with role='status' and aria-live='polite'", () => {
      const { container } = render(<InventoryDetailLoading />);
      const statusElement = container.querySelector('[role="status"]');

      expect(statusElement).toBeInTheDocument();
      expect(statusElement?.getAttribute("aria-live")).toBe("polite");
      expect(statusElement?.getAttribute("aria-label")).toContain("Loading stock ledger");
    });
  });
});
