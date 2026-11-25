import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import {
  OptimizedImage,
  ProductImage,
  getOptimizedImageUrl,
} from "../components/ui/optimized-image";

describe("Task 18 — Admin Image & Font Optimization", () => {
  describe("Admin getOptimizedImageUrl Transformation", () => {
    it("transforms Cloudinary upload URLs to modern auto-format and auto-quality", () => {
      const rawUrl =
        "https://res.cloudinary.com/veyora/image/upload/v1700000000/profiles/staff/admin-01.jpg";
      const optimized = getOptimizedImageUrl(rawUrl);

      expect(optimized).toBe(
        "https://res.cloudinary.com/veyora/image/upload/f_auto,q_auto/v1700000000/profiles/staff/admin-01.jpg"
      );
    });

    it("appends width constraint for admin table thumbnail images", () => {
      const rawUrl =
        "https://res.cloudinary.com/veyora/image/upload/v1700000000/products/catalog-thumb.jpg";
      const optimized = getOptimizedImageUrl(rawUrl, { width: 48 });

      expect(optimized).toContain("f_auto,q_auto,w_96,c_limit");
    });
  });

  describe("Admin OptimizedImage Component with Lucide Loader2", () => {
    it("renders spinning Lucide Loader2 icon during thumbnail load", () => {
      const { container } = render(
        <OptimizedImage
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f"
          alt="Product Thumbnail"
          width={48}
          height={48}
        />
      );

      const statusLoader = screen.getByRole("status");
      expect(statusLoader).toBeInTheDocument();
      expect(statusLoader.getAttribute("aria-live")).toBe("polite");

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("unmounts Loader2 and sets opacity-100 once image loads", async () => {
      render(
        <OptimizedImage
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f"
          alt="Product Thumbnail"
          width={48}
          height={48}
        />
      );

      const img = screen.getByAltText("Product Thumbnail");
      Object.defineProperty(img, "naturalWidth", { value: 48, configurable: true });
      fireEvent.load(img);

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        expect(img.className).toContain("opacity-100");
      });
    });

    it("renders fallback Package icon when image fails", () => {
      const { container } = render(
        <OptimizedImage
          src="https://broken-asset.com/none.png"
          alt="Missing Product"
          width={48}
          height={48}
        />
      );

      const img = screen.getByAltText("Missing Product");
      fireEvent.error(img);

      const fallbackIcon = container.querySelector(".lucide-package");
      expect(fallbackIcon).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("Admin ProductImage Aspect Ratio & Layout Stability", () => {
    it("preserves aspect ratio styling and relative container positioning", () => {
      const { container } = render(
        <ProductImage
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f"
          alt="Admin Preview"
          aspectRatio="aspect-[3/4]"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("aspect-[3/4]");
      expect(wrapper.className).toContain("relative");
      expect(wrapper.className).toContain("overflow-hidden");
    });
  });
});
