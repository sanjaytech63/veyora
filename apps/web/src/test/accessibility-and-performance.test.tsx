import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { StoreLayout } from "@/components/layout/store-layout";
import { SearchResults } from "@/components/navigation/search/SearchResults";
import type { Product, ProductVariant, ProductImage } from "@veyora/types";

// Mock zustand stores
vi.mock("@/stores/ui-store", () => ({
  useUIStore: vi.fn((selector) => {
    const state = {
      cartDrawerOpen: false,
      setCartDrawerOpen: vi.fn(),
      searchModalOpen: false,
      setSearchModalOpen: vi.fn(),
      mobileNavOpen: false,
      setMobileNavOpen: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock("@/lib/hooks/use-wishlist", () => ({
  useWishlist: () => ({
    isInWishlist: (id: string) => id === "prod-fav",
    toggleWishlist: vi.fn(),
    isAddingToWishlist: false,
    isRemovingFromWishlist: false,
  }),
}));

vi.mock("@/lib/hooks/use-cart", () => ({
  useCart: () => ({
    items: [],
    totals: { itemCount: 0, subtotal: 0, discount: 0, shipping: 0, estimatedTax: 0, total: 0 },
    isLoading: false,
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-catalog", () => ({
  useCategories: () => ({ data: [] }),
  useProducts: () => ({ data: { items: [], total: 0 } }),
  useSearchSuggestions: () => ({ data: { suggestions: [], categories: [] }, isLoading: false }),
  useSearch: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));

describe("Task 20 — Storefront Accessibility & Performance Architecture", () => {
  describe("1. Landmark Structure & Skip Navigation", () => {
    it("renders a visible-on-focus skip link targeting the main content landmark", () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <StoreLayout>
            <div>Page Content</div>
          </StoreLayout>
        </QueryClientProvider>
      );

      const skipLink = screen.getByRole("link", { name: /skip to main content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute("href", "#main-content");
      expect(skipLink.className).toContain("sr-only");
      expect(skipLink.className).toContain("focus:not-sr-only");

      const mainLandmark = screen.getByRole("main");
      expect(mainLandmark).toHaveAttribute("id", "main-content");
      expect(mainLandmark).toHaveAttribute("tabIndex", "-1");
    });
  });

  describe("2. Form Accessibility & Error Announcements", () => {
    it("renders FormMessage with role='alert' and aria-live='polite' for screen reader announcements", () => {
      render(<FormMessage>Please provide a valid shipping destination</FormMessage>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute("aria-live", "polite");
      expect(alert).toHaveTextContent("Please provide a valid shipping destination");
    });

    it("renders Input with accessible invalid attribute styles", () => {
      const { rerender } = render(<Input placeholder="Email" aria-invalid="true" />);
      const input = screen.getByPlaceholderText("Email");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input.className).toContain("aria-[invalid=true]:border-destructive");

      rerender(<Input placeholder="Email" error={true} />);
      expect(input.className).toContain("border-destructive");
    });
  });

  describe("3. Interactive Component State & ARIA Attributes", () => {
    it("WishlistButton communicates toggle state via aria-pressed and accessible label", () => {
      const { rerender } = render(<WishlistButton productId="prod-fav" />);
      const activeBtn = screen.getByRole("button", { name: /remove from personal collection/i });
      expect(activeBtn).toHaveAttribute("aria-pressed", "true");

      rerender(<WishlistButton productId="prod-other" />);
      const inactiveBtn = screen.getByRole("button", { name: /save to personal collection/i });
      expect(inactiveBtn).toHaveAttribute("aria-pressed", "false");
    });

    it("VariantSelector renders accessible radiogroups and pressed states for colors and sizes", () => {
      const mockVariants: ProductVariant[] = [
        {
          id: "var-1",
          sku: "KURTI-RED-S",
          color: "Crimson Red",
          size: "S",
          price: 120,
          stock: 5,
        },
        {
          id: "var-2",
          sku: "KURTI-RED-M",
          color: "Crimson Red",
          size: "M",
          price: 120,
          stock: 0,
        },
        {
          id: "var-3",
          sku: "KURTI-BLUE-S",
          color: "Royal Blue",
          size: "S",
          price: 120,
          stock: 8,
        },
      ];

      render(
        <VariantSelector
          variants={mockVariants}
          selectedVariant={mockVariants[0]!}
          onSelectVariant={vi.fn()}
        />
      );

      const colorGroup = screen.getByRole("radiogroup", { name: /color options/i });
      expect(colorGroup).toBeInTheDocument();

      const sizeGroup = screen.getByRole("radiogroup", { name: /size options/i });
      expect(sizeGroup).toBeInTheDocument();

      const selectedColorBtn = screen.getByRole("radio", { name: /crimson red, selected/i });
      expect(selectedColorBtn).toHaveAttribute("aria-checked", "true");

      const outOfStockSizeBtn = screen.getByRole("radio", { name: /m.*out of stock/i });
      expect(outOfStockSizeBtn).toBeDisabled();
    });

    it("ProductGallery marks carousel region and communicates active thumbnails", () => {
      const mockImages: ProductImage[] = [
        { url: "https://res.cloudinary.com/veyora/img1.jpg", alt: "Garment front", order: 0 },
        { url: "https://res.cloudinary.com/veyora/img2.jpg", alt: "Garment detail", order: 1 },
      ];

      render(<ProductGallery images={mockImages} title="Silk Kurti" />);

      const carousel = screen.getByRole("region", { name: /product image gallery/i });
      expect(carousel).toHaveAttribute("aria-roledescription", "carousel");

      const thumb1 = screen.getByRole("button", { name: /view image 1 of 2/i });
      expect(thumb1).toHaveAttribute("aria-current", "true");

      const thumb2 = screen.getByRole("button", { name: /view image 2 of 2/i });
      expect(thumb2).not.toHaveAttribute("aria-current");
    });

    it("SearchResults communicates dynamic updates via aria-live polite region", () => {
      const mockProducts: Product[] = [
        {
          id: "p1",
          slug: "chanderi-kurti",
          title: "Chanderi Silk Kurti",
          price: 140,
          stock: 10,
          images: [],
          description: "Luxury kurti",
        } as unknown as Product,
      ];

      const { container } = render(
        <SearchResults
          products={mockProducts}
          query="chanderi"
          onSelectProduct={vi.fn()}
          onViewAll={vi.fn()}
        />
      );

      const liveContainer = container.querySelector("[aria-live='polite']");
      expect(liveContainer).toBeInTheDocument();
      expect(liveContainer).toHaveAttribute("aria-atomic", "true");
    });
  });

  describe("4. Focus Indicators & Contrast", () => {
    it("Button includes high-contrast focus-visible ring classes", () => {
      render(<Button>Interactive Action</Button>);
      const btn = screen.getByRole("button", { name: /interactive action/i });
      expect(btn.className).toContain("focus-visible:ring-2");
      expect(btn.className).toContain("focus-visible:ring-offset-2");
    });
  });
});
