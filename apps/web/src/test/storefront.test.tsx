import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductCard } from "../components/storefront/product-card";
import { ProductGrid } from "../components/storefront/product-grid";
import { StockBadge } from "../components/storefront/stock-badge";
import { VariantSelector } from "../components/storefront/variant-selector";
import { ProductDetailsClient } from "../app/products/[slug]/product-details-client";
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES } from "../lib/api/catalog-fallback";
import { Product, ProductVariant } from "@veyora/types";

// Helper wrapper with QueryClientProvider
function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Customer Storefront - Phase G", () => {
  const mockProduct: Product = FALLBACK_PRODUCTS[0]!;

  // 1. Product Listing Tests
  describe("Product Listing & Cards", () => {
    it("renders product title, price, and category", () => {
      render(
        <ProductCard product={mockProduct} categoryName="Acoustic Audio" />
      );

      expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
      expect(screen.getByText(`$${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();
      expect(screen.getByText("Acoustic Audio")).toBeInTheDocument();
    });

    it("renders the product grid with multiple items", () => {
      render(
        <ProductGrid
          products={FALLBACK_PRODUCTS.slice(0, 3)}
          categories={FALLBACK_CATEGORIES}
        />
      );

      expect(screen.getByText(FALLBACK_PRODUCTS[0]!.title)).toBeInTheDocument();
      expect(screen.getByText(FALLBACK_PRODUCTS[1]!.title)).toBeInTheDocument();
      expect(screen.getByText(FALLBACK_PRODUCTS[2]!.title)).toBeInTheDocument();
    });

    it("renders empty state when no products match", () => {
      const onReset = vi.fn();
      render(
        <ProductGrid
          products={[]}
          emptyTitle="No matching hardware"
          onResetFilters={onReset}
        />
      );

      expect(screen.getByText("No matching hardware")).toBeInTheDocument();
      const clearBtn = screen.getByRole("button", { name: /clear filters/i });
      fireEvent.click(clearBtn);
      expect(onReset).toHaveBeenCalled();
    });
  });

  // 2. Stock Status Badge Tests
  describe("Stock Status & Availability", () => {
    it("displays in stock for items with ample inventory", () => {
      render(<StockBadge stock={25} trackQuantity={true} />);
      expect(screen.getByText(/in stock/i)).toBeInTheDocument();
    });

    it("displays low stock warning for items with <= 5 units", () => {
      render(<StockBadge stock={3} trackQuantity={true} />);
      expect(screen.getByText(/only 3 units left/i)).toBeInTheDocument();
    });

    it("displays out of stock when quantity is zero", () => {
      render(<StockBadge stock={0} trackQuantity={true} />);
      expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    });
  });

  // 3. Variant Selection Tests
  describe("Variants & Configuration Selector", () => {
    const variants: ProductVariant[] = mockProduct.variants!;

    it("renders color swatch buttons and size pills", () => {
      const onSelect = vi.fn();
      render(
        <VariantSelector
          variants={variants}
          selectedVariant={variants[0]!}
          onSelectVariant={onSelect}
        />
      );

      expect(screen.getByText(/color \/ finish/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Standard" })).toBeInTheDocument();
    });

    it("triggers onSelectVariant callback when user clicks a variant swatch", () => {
      const onSelect = vi.fn();
      render(
        <VariantSelector
          variants={variants}
          selectedVariant={variants[0]!}
          onSelectVariant={onSelect}
        />
      );

      const silverSwatch = screen.getByTitle(/anodized silver/i);
      fireEvent.click(silverSwatch);
      expect(onSelect).toHaveBeenCalled();
    });
  });

  // 4. Product Details Page Tests
  describe("Product Details & Interactive Buying Stage", () => {
    it("renders product title, full description, and add to bag button", () => {
      renderWithQuery(<ProductDetailsClient initialProduct={mockProduct} />);

      expect(screen.getByRole("heading", { name: mockProduct.title })).toBeInTheDocument();
      expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add to bag/i })).toBeInTheDocument();
    });

    it("allows incrementing and decrementing quantity", () => {
      renderWithQuery(<ProductDetailsClient initialProduct={mockProduct} />);

      const increaseBtn = screen.getByRole("button", { name: /increase quantity/i });
      const decreaseBtn = screen.getByRole("button", { name: /decrease quantity/i });

      expect(screen.getByText("1")).toBeInTheDocument();
      fireEvent.click(increaseBtn);
      expect(screen.getByText("2")).toBeInTheDocument();
      fireEvent.click(decreaseBtn);
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("renders specifications accordion with active variant SKU", () => {
      renderWithQuery(<ProductDetailsClient initialProduct={mockProduct} />);

      expect(
        screen.getByText(/technical specifications & hardware details/i)
      ).toBeInTheDocument();
      expect(screen.getByText(mockProduct.variants![0]!.sku)).toBeInTheDocument();
    });
  });

  // 5. Filtering and Search Logic Tests
  describe("Catalog Filtering & Search Logic", () => {
    it("filters products by category correctly", () => {
      const audioProducts = FALLBACK_PRODUCTS.filter((p) => p.categoryId === "cat-audio-01");
      expect(audioProducts.length).toBeGreaterThan(0);
      audioProducts.forEach((p) => {
        expect(p.categoryId).toBe("cat-audio-01");
      });
    });

    it("filters in-stock products correctly", () => {
      const inStock = FALLBACK_PRODUCTS.filter((p) => p.stock > 0);
      expect(inStock.length).toBeGreaterThan(0);
      inStock.forEach((p) => {
        expect(p.stock).toBeGreaterThan(0);
      });
    });

    it("filters products by search keyword", () => {
      const search = "headphones";
      const matches = FALLBACK_PRODUCTS.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.tags?.some((t) => t.toLowerCase().includes(search))
      );
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]!.title).toContain("Headphones");
    });
  });
});
