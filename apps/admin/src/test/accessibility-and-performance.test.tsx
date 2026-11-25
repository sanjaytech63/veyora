import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminNav } from "@/components/layout/admin-nav";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Mock Admin UI store
vi.mock("@/stores/admin-ui-store", () => ({
  useAdminUIStore: vi.fn((selector) => {
    const state = {
      sidebarCollapsed: false,
      toggleSidebar: vi.fn(),
      mobileSidebarOpen: false,
      setMobileSidebarOpen: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
}));

describe("Task 20 — Admin Accessibility & Performance Architecture", () => {
  describe("1. Admin Navigation Landmarks & States", () => {
    it("renders navigation landmark with aria-label and aria-current on the active route", () => {
      render(<AdminNav collapsed={false} />);

      const nav = screen.getByRole("navigation", { name: /admin navigation/i });
      expect(nav).toBeInTheDocument();

      const activeLink = screen.getByRole("link", { name: /products & apparel/i });
      expect(activeLink).toHaveAttribute("aria-current", "page");

      const inactiveLink = screen.getByRole("link", { name: /dashboard/i });
      expect(inactiveLink).not.toHaveAttribute("aria-current");
    });

    it("provides accessible aria-label on links when sidebar is collapsed", () => {
      render(<AdminNav collapsed={true} />);

      const collapsedProductLink = screen.getByRole("link", { name: /products & apparel/i });
      expect(collapsedProductLink).toHaveAttribute("aria-label", "Products & Apparel");
    });

    it("sidebar toggle button provides accessible action description", () => {
      render(<AdminSidebar />);

      const toggleBtn = screen.getByRole("button", { name: /collapse sidebar/i });
      expect(toggleBtn).toBeInTheDocument();
    });
  });

  describe("2. Form Accessibility & Focus Ring Enhancements", () => {
    it("Admin FormMessage renders with role='alert' and aria-live='polite'", () => {
      render(<FormMessage>Administrator authorization required</FormMessage>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute("aria-live", "polite");
      expect(alert).toHaveTextContent("Administrator authorization required");
    });

    it("Admin Input includes high-contrast focus rings and aria-invalid error styles", () => {
      const { rerender } = render(<Input placeholder="Admin Email" aria-invalid="true" />);
      const input = screen.getByPlaceholderText("Admin Email");

      expect(input.className).toContain("focus-visible:ring-2");
      expect(input.className).toContain("focus-visible:ring-offset-2");
      expect(input.className).toContain("aria-[invalid=true]:border-destructive");

      rerender(<Input placeholder="Admin Email" error={true} />);
      expect(input.className).toContain("border-destructive");
    });

    it("Admin Button includes high-contrast focus-visible rings", () => {
      render(<Button>Submit Administrative Order</Button>);
      const btn = screen.getByRole("button", { name: /submit administrative order/i });
      expect(btn.className).toContain("focus-visible:ring-2");
      expect(btn.className).toContain("focus-visible:ring-offset-2");
    });
  });
});
