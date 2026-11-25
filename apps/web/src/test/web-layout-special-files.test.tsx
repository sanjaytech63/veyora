import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { StoreLayout } from "../components/layout/store-layout";
import RootError from "../app/error";
import NotFound from "../app/not-found";
import ShopLoading from "../app/shop/loading";
import ProductDetailLoading from "../app/products/[slug]/loading";
import OrdersLoading from "../app/orders/loading";
import { useAuthStore } from "../stores/auth-store";
import { getQueryClient, clearQueryClient } from "../lib/api/query-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Web Storefront Layout Architecture & Special Files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  describe("StoreLayout Semantic Structure & Accessibility", () => {
    it("renders skip navigation link targeting main content landmark", () => {
      const queryClient = getQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <StoreLayout>
            <div data-testid="store-content">Storefront Body</div>
          </StoreLayout>
        </QueryClientProvider>
      );

      const skipLink = screen.getByText("Skip to main content");
      expect(skipLink).toBeInTheDocument();
      expect(skipLink.getAttribute("href")).toBe("#main-content");

      const main = document.getElementById("main-content");
      expect(main).toBeInTheDocument();
      expect(screen.getByTestId("store-content")).toBeInTheDocument();
    });
  });

  describe("Special Files: Error Boundary Recovery", () => {
    it("renders RootError with message, digest, and handles reset() retry action", () => {
      const resetMock = vi.fn();
      const mockError = new Error("Failed to load storefront catalog");
      Object.assign(mockError, { digest: "STORE-DIGEST-99" });

      render(<RootError error={mockError} reset={resetMock} />);

      expect(screen.getByText("Something Went Wrong")).toBeInTheDocument();
      expect(screen.getByText("Failed to load storefront catalog")).toBeInTheDocument();
      expect(screen.getByText(/Diagnostic Digest: STORE-DIGEST-99/)).toBeInTheDocument();

      const retryBtn = screen.getByRole("button", { name: /Try Again/i });
      fireEvent.click(retryBtn);
      expect(resetMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Special Files: Not-Found Boundary", () => {
    it("renders branded NotFound UI with home and catalog links", () => {
      render(<NotFound />);

      expect(screen.getByText("Page Not Located")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Return Home/i })).toHaveAttribute("href", "/");
      expect(screen.getByRole("link", { name: /Browse Catalog/i })).toHaveAttribute(
        "href",
        "/shop"
      );
    });
  });

  describe("Special Files: Route-Specific Skeletons", () => {
    it("renders ShopLoading skeleton placeholders", () => {
      const { container } = render(<ShopLoading />);
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("renders ProductDetailLoading skeleton with 2-column layout", () => {
      const { container } = render(<ProductDetailLoading />);
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("renders OrdersLoading skeleton placeholders", () => {
      const { container } = render(<OrdersLoading />);
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Architecture & QueryClient Cache Isolation", () => {
    it("clears cached queries when clearQueryClient is invoked on logout", () => {
      const queryClient = getQueryClient();
      queryClient.setQueryData(["customer-orders"], [{ id: "order-1" }]);
      expect(queryClient.getQueryData(["customer-orders"])).toEqual([{ id: "order-1" }]);

      clearQueryClient();
      expect(queryClient.getQueryData(["customer-orders"])).toBeUndefined();
    });

    it("triggers clearQueryClient automatically when clearAuth is executed", () => {
      const queryClient = getQueryClient();
      queryClient.setQueryData(["customer-profile"], { name: "Aria" });

      useAuthStore.getState().clearAuth();
      expect(queryClient.getQueryData(["customer-profile"])).toBeUndefined();
    });
  });
});
