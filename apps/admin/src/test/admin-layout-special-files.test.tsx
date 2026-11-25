import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AdminLayout } from "../components/layout/admin-layout";
import AdminError from "../app/error";
import AdminNotFound from "../app/not-found";
import AdminLoading from "../app/loading";
import { useAdminAuthStore } from "../stores/admin-auth-store";
import { getQueryClient, clearQueryClient } from "../lib/api/query-client";

let currentPathname = "/";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => currentPathname,
}));

describe("Admin Layout Architecture & Special Files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminAuthStore.getState().clearAdminAuth();
  });

  describe("AdminLayout Shell Isolation", () => {
    it("renders unauthenticated login route without sidebar or header shell", () => {
      currentPathname = "/login";

      render(
        <AdminLayout>
          <div data-testid="login-content">Login Form Content</div>
        </AdminLayout>
      );

      expect(screen.getByTestId("login-content")).toBeInTheDocument();
      // Ensure sidebar nav is not mounted
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
      expect(screen.queryByText("Products & Apparel")).not.toBeInTheDocument();
      // Ensure main content landmark is present
      const main = document.getElementById("admin-main");
      expect(main).toBeInTheDocument();
    });

    it("renders authenticated dashboard layout with skip link, sidebar, and header", () => {
      currentPathname = "/products";
      useAdminAuthStore.getState().setAdminAuth(
        {
          id: "adm-01",
          email: "director@veyora.com",
          firstName: "Director",
          lastName: "Atelier",
          role: "admin",
          permissions: ["all"],
          isEmailVerified: true,
        },
        "mock-jwt-token"
      );

      render(
        <AdminLayout>
          <div data-testid="dashboard-content">Dashboard Catalog Content</div>
        </AdminLayout>
      );

      expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
      // Verify skip navigation link exists
      const skipLink = screen.getByText("Skip to administrative content");
      expect(skipLink).toBeInTheDocument();
      expect(skipLink.getAttribute("href")).toBe("#admin-main");

      // Verify sidebar navigation rendered
      expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Products & Apparel")).toBeInTheDocument();
    });
  });

  describe("Special Files: Error Boundary Recovery", () => {
    it("renders AdminError with message, digest, and handles reset() retry action", () => {
      const resetMock = vi.fn();
      const mockError = new Error("Failed to load catalog inventory ledger");
      Object.assign(mockError, { digest: "DIGEST-7701" });

      render(<AdminError error={mockError} reset={resetMock} />);

      expect(screen.getByText("Administration Console Interrupted")).toBeInTheDocument();
      expect(screen.getByText("Failed to load catalog inventory ledger")).toBeInTheDocument();
      expect(screen.getByText(/Diagnostic Digest: DIGEST-7701/)).toBeInTheDocument();

      const retryBtn = screen.getByRole("button", { name: /Retry Action/i });
      fireEvent.click(retryBtn);
      expect(resetMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Special Files: Not-Found Boundary", () => {
    it("renders branded AdminNotFound UI with escape return link", () => {
      render(<AdminNotFound />);

      expect(screen.getByText("Administrative Resource Not Located")).toBeInTheDocument();
      const returnLink = screen.getByRole("link", { name: /Return to Executive Dashboard/i });
      expect(returnLink).toBeInTheDocument();
      expect(returnLink.getAttribute("href")).toBe("/");
    });
  });

  describe("Special Files: Loading Skeletons", () => {
    it("renders AdminLoading skeleton placeholders with pulse styling", () => {
      const { container } = render(<AdminLoading />);
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Architecture & QueryClient Cache Isolation", () => {
    it("clears cached queries when clearQueryClient is invoked on logout", () => {
      const queryClient = getQueryClient();
      queryClient.setQueryData(["admin-sensitive-data"], { secret: "12345" });
      expect(queryClient.getQueryData(["admin-sensitive-data"])).toEqual({ secret: "12345" });

      clearQueryClient();
      expect(queryClient.getQueryData(["admin-sensitive-data"])).toBeUndefined();
    });

    it("triggers clearQueryClient automatically when clearAdminAuth is executed", () => {
      const queryClient = getQueryClient();
      queryClient.setQueryData(["admin-order-dossier"], { orderId: "ord-88" });

      useAdminAuthStore.getState().clearAdminAuth();
      expect(queryClient.getQueryData(["admin-order-dossier"])).toBeUndefined();
    });
  });
});
