import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import {
  OptimizedImage,
  ProductImage,
  getOptimizedImageUrl,
} from "../components/ui/optimized-image";

describe("Task 18 — Web Image & Font Optimization", () => {
  describe("getOptimizedImageUrl Transformation", () => {
    it("transforms raw Cloudinary upload URLs to modern auto-format and auto-quality", () => {
      const rawUrl =
        "https://res.cloudinary.com/veyora/image/upload/v1700000000/products/silk-kurti.jpg";
      const optimized = getOptimizedImageUrl(rawUrl);

      expect(optimized).toBe(
        "https://res.cloudinary.com/veyora/image/upload/f_auto,q_auto/v1700000000/products/silk-kurti.jpg"
      );
    });

    it("appends width constraint parameters when width is specified", () => {
      const rawUrl =
        "https://res.cloudinary.com/veyora/image/upload/v1700000000/products/silk-kurti.jpg";
      const optimized = getOptimizedImageUrl(rawUrl, { width: 400 });

      expect(optimized).toContain("f_auto,q_auto,w_800,c_limit");
    });

    it("preserves Cloudinary URLs that already specify transformation parameters", () => {
      const alreadyTransformed =
        "https://res.cloudinary.com/veyora/image/upload/c_fill,w_300,h_400/v1700000000/sample.jpg";
      expect(getOptimizedImageUrl(alreadyTransformed)).toBe(alreadyTransformed);
    });

    it("leaves non-Cloudinary URLs unmodified", () => {
      const unsplashUrl =
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800";
      expect(getOptimizedImageUrl(unsplashUrl)).toBe(unsplashUrl);
    });
  });

  describe("OptimizedImage Component with Lucide Loader2", () => {
    it("renders spinning Lucide Loader2 icon while image is in loading state", () => {
      const { container } = render(
        <OptimizedImage
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f"
          alt="Silk Chanderi Kurti"
          width={400}
          height={500}
        />
      );

      // Verify loader with role="status" and sr-only message is rendered
      const statusLoader = screen.getByRole("status");
      expect(statusLoader).toBeInTheDocument();
      expect(statusLoader.getAttribute("aria-live")).toBe("polite");
      expect(screen.getByText("Loading garment image...")).toBeInTheDocument();

      // Verify Lucide Loader2 spinner element exists
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("removes Loader2 and sets opacity-100 once image loads", async () => {
      render(
        <OptimizedImage
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f"
          alt="Silk Chanderi Kurti"
          width={400}
          height={500}
        />
      );

      const img = screen.getByAltText("Silk Chanderi Kurti");
      Object.defineProperty(img, "naturalWidth", { value: 400, configurable: true });
      fireEvent.load(img);

      // Loader unmounts upon load completion
      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        expect(img.className).toContain("opacity-100");
      });
    });

    it("renders fallback Package icon when image errors or source is empty", () => {
      const { container } = render(
        <OptimizedImage
          src="https://invalid-url.com/broken.jpg"
          alt="Broken Garment"
          width={400}
          height={500}
        />
      );

      const img = screen.getByAltText("Broken Garment");
      fireEvent.error(img);

      // Fallback Package icon rendered
      const fallbackIcon = container.querySelector(".lucide-package");
      expect(fallbackIcon).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("ProductImage Aspect Ratio & Layout Stability", () => {
    it("reserves aspect-[4/5] container space to prevent Cumulative Layout Shift (CLS)", () => {
      const { container } = render(
        <ProductImage
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f"
          alt="Editorial Lookbook"
          aspectRatio="aspect-[4/5]"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("aspect-[4/5]");
      expect(wrapper.className).toContain("relative");
      expect(wrapper.className).toContain("overflow-hidden");
    });
  });
});
