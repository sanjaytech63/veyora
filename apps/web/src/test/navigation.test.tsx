import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar, NavbarLogo, NavbarLinks } from "../components/navigation/navbar";
import {
  SearchDialog,
  SearchTrigger,
  SearchPopularCategories,
  SearchRecentSearches,
} from "../components/navigation/search";
import {
  Footer,
  FooterBrand,
  FooterNewsletter,
  FooterBottom,
} from "../components/navigation/footer";
import { Category } from "@veyora/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

const TEST_CATEGORIES: Category[] = [
  {
    id: "cat-kurtis",
    name: "Kurtis & Sets",
    slug: "kurtis",
    description: "Mulmul and silk kurtis",
    order: 1,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-lehengas",
    name: "Festive Lehengas",
    slug: "lehengas",
    description: "Bridal and festive lehengas",
    order: 2,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Storefront Navigation & Navbar", () => {
  it("renders NavbarLogo with atelier branding", () => {
    render(<NavbarLogo />);
    expect(screen.getByText(/veyora/i)).toBeInTheDocument();
    expect(screen.getByText("Atelier")).toBeInTheDocument();
  });

  it("renders desktop navigation links", () => {
    render(<NavbarLinks />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Shop All")).toBeInTheDocument();
    expect(screen.getByText("New Arrivals")).toBeInTheDocument();
    expect(screen.getByText("Collections")).toBeInTheDocument();
  });

  it("renders Navbar with actions and accessibility labels", () => {
    renderWithClient(<Navbar showAnnouncement={false} />);
    expect(screen.getAllByText(/veyora/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/shopping bag/i)).toBeInTheDocument();
  });
});

describe("Search Experience & Dialog", () => {
  it("renders SearchTrigger with keyboard shortcut hint", () => {
    render(<SearchTrigger variant="pill" />);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
    expect(screen.getByText(/search kurtis, lehengas/i)).toBeInTheDocument();
  });

  it("renders SearchPopularCategories with category tags", () => {
    const handleSelect = vi.fn();
    render(
      <SearchPopularCategories categories={TEST_CATEGORIES} onSelectCategory={handleSelect} />
    );

    expect(screen.getByText("Curated Departments")).toBeInTheDocument();
    const kurtiButton = screen.getByText("Kurtis & Sets");
    expect(kurtiButton).toBeInTheDocument();

    fireEvent.click(kurtiButton);
    expect(handleSelect).toHaveBeenCalledWith("kurtis", "Kurtis & Sets");
  });

  it("renders SearchRecentSearches with remove and clear all", () => {
    const handleSelect = vi.fn();
    const handleRemove = vi.fn();
    const handleClearAll = vi.fn();

    render(
      <SearchRecentSearches
        searches={["Chanderi Silk", "Bandhani"]}
        onSelect={handleSelect}
        onRemove={handleRemove}
        onClearAll={handleClearAll}
      />
    );

    expect(screen.getByText("Recent Searches")).toBeInTheDocument();
    expect(screen.getByText("Chanderi Silk")).toBeInTheDocument();
    expect(screen.getByText("Bandhani")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear all"));
    expect(handleClearAll).toHaveBeenCalledTimes(1);
  });

  it("renders SearchDialog when open", () => {
    renderWithClient(<SearchDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByPlaceholderText(/search kurtis, lehengas, bandhgalas/i)).toBeInTheDocument();
  });
});

describe("Storefront Footer", () => {
  it("renders FooterBrand with brand statement", () => {
    render(<FooterBrand />);
    expect(screen.getByText(/veyora/i)).toBeInTheDocument();
    expect(screen.getByText(/contemporary indian couture/i)).toBeInTheDocument();
  });

  it("validates email in FooterNewsletter", async () => {
    render(<FooterNewsletter />);
    const input = screen.getByPlaceholderText("Enter your email");
    const form = input.closest("form")!;

    // Try invalid email
    fireEvent.change(input, { target: { value: "invalid-email" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it("renders FooterBottom with current year copyright", () => {
    render(<FooterBottom />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
  });

  it("renders complete responsive Footer", () => {
    renderWithClient(<Footer />);
    expect(screen.getByText(/worldwide express dispatch/i)).toBeInTheDocument();
    expect(screen.getByText(/artisanal provenance/i)).toBeInTheDocument();
    expect(screen.getByText(/client concierge/i)).toBeInTheDocument();
  });
});
