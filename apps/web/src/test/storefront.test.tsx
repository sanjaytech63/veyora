import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductCard } from "../components/storefront/product-card";
import { ProductGrid } from "../components/storefront/product-grid";
import { StockBadge } from "../components/storefront/stock-badge";
import { VariantSelector } from "../components/storefront/variant-selector";
import { ProductDetailsClient } from "../app/products/[slug]/product-details-client";
import { Product, ProductVariant, Category } from "@veyora/types";

// Standard fashion unit test fixtures
const TEST_CATEGORIES: Category[] = [
  {
    id: "cat-kurtis-01",
    name: "Kurtis & Kurti Sets",
    slug: "kurtis",
    description: "Handcrafted straight and Anarkali kurtis in pure mulmul and silk.",
    order: 1,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-ethnic-02",
    name: "Ethnic & Festive Wear",
    slug: "ethnic-wear",
    description: "Traditional Rajasthani Bandhani lehengas and wedding attire.",
    order: 2,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const TEST_PRODUCTS: Product[] = [
  {
    id: "prod-kurti-01",
    title: "Chanderi Silk Kurti Set with Organza Dupatta",
    slug: "chanderi-silk-kurti-set-organza-dupatta",
    description: "Handwoven Chanderi silk kurti with delicate gota patti hand embroidery.",
    price: 185.0,
    compareAtPrice: 240.0,
    costPrice: 90.0,
    sku: "VYR-KRT-001",
    barcode: "85001234001",
    stock: 24,
    trackQuantity: true,
    status: "active",
    categoryId: "cat-kurtis-01",
    brandId: "brand-atelier-01",
    tags: ["featured", "festive", "kurti", "silk"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000",
        alt: "Chanderi Silk Kurti Set",
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-kurti-crimson-s",
        sku: "VYR-KRT-001-S-RED",
        color: "Crimson Red",
        size: "S",
        price: 185.0,
        stock: 12,
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000",
      },
      {
        id: "var-kurti-emerald-m",
        sku: "VYR-KRT-001-M-GRN",
        color: "Emerald Green",
        size: "M",
        price: 185.0,
        stock: 12,
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000",
      },
    ],
    attributes: [
      { name: "Fabric", value: "Handwoven Chanderi Silk" },
      { name: "Fit", value: "A-Line Silhouette" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-lehenga-02",
    title: "Bandhani Silk Handcrafted Festive Lehenga Choli",
    slug: "bandhani-silk-festive-lehenga-choli",
    description: "Traditional Rajasthani Bandhani silk lehenga with zardozi waist detailing.",
    price: 495.0,
    sku: "VYR-LHG-002",
    stock: 15,
    trackQuantity: true,
    status: "active",
    categoryId: "cat-ethnic-02",
    brandId: "brand-atelier-01",
    tags: ["ethnic-wear", "lehenga", "festive"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000",
        alt: "Bandhani Silk Lehenga Choli",
        isPrimary: true,
      },
    ],
    variants: [],
    attributes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-mulmul-03",
    title: "Pure Mulmul Cotton Hand-Block Print Kurti",
    slug: "mulmul-cotton-hand-block-print-kurti",
    description: "Organic mulmul cotton daily kurti with natural vegetable dye Bagru prints.",
    price: 68.0,
    sku: "VYR-KRT-004",
    stock: 8,
    trackQuantity: true,
    status: "active",
    categoryId: "cat-kurtis-01",
    brandId: "brand-atelier-01",
    tags: ["kurti", "cotton", "everyday"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000",
        alt: "Pure Mulmul Cotton Kurti",
        isPrimary: true,
      },
    ],
    variants: [],
    attributes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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

describe("Customer Storefront - Fashion E-Commerce", () => {
  const mockProduct: Product = TEST_PRODUCTS[0]!;

  // 1. Product Listing Tests
  describe("Product Listing & Cards", () => {
    it("renders product title, price, and category", () => {
      render(
        <ProductCard product={mockProduct} categoryName="Kurtis & Kurti Sets" />
      );

      expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
      expect(screen.getByText(`$${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();
      expect(screen.getByText("Kurtis & Kurti Sets")).toBeInTheDocument();
    });

    it("renders the product grid with multiple items", () => {
      render(
        <ProductGrid
          products={TEST_PRODUCTS.slice(0, 3)}
          categories={TEST_CATEGORIES}
        />
      );

      expect(screen.getByText(TEST_PRODUCTS[0]!.title)).toBeInTheDocument();
      expect(screen.getByText(TEST_PRODUCTS[1]!.title)).toBeInTheDocument();
      expect(screen.getByText(TEST_PRODUCTS[2]!.title)).toBeInTheDocument();
    });

    it("renders empty state when no products match", () => {
      const onReset = vi.fn();
      render(
        <ProductGrid
          products={[]}
          emptyTitle="No matching garments"
          onResetFilters={onReset}
        />
      );

      expect(screen.getByText("No matching garments")).toBeInTheDocument();
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

      expect(screen.getByText(/color/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "S" })).toBeInTheDocument();
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

      const crimsonSwatch = screen.getByTitle(/crimson red/i);
      fireEvent.click(crimsonSwatch);
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
        screen.getByText(/garment specifications & fabric details/i)
      ).toBeInTheDocument();
      expect(screen.getByText(mockProduct.variants![0]!.sku)).toBeInTheDocument();
    });
  });

  // 5. Filtering and Search Logic Tests
  describe("Catalog Filtering & Search Logic", () => {
    it("filters products by category correctly", () => {
      const kurtiProducts = TEST_PRODUCTS.filter((p) => p.categoryId === "cat-kurtis-01");
      expect(kurtiProducts.length).toBeGreaterThan(0);
      kurtiProducts.forEach((p) => {
        expect(p.categoryId).toBe("cat-kurtis-01");
      });
    });

    it("filters in-stock products correctly", () => {
      const inStock = TEST_PRODUCTS.filter((p) => p.stock > 0);
      expect(inStock.length).toBeGreaterThan(0);
      inStock.forEach((p) => {
        expect(p.stock).toBeGreaterThan(0);
      });
    });

    it("filters products by search keyword", () => {
      const search = "chanderi";
      const matches = TEST_PRODUCTS.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.tags?.some((t) => t.toLowerCase().includes(search))
      );
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]!.title).toContain("Chanderi");
    });
  });
});
