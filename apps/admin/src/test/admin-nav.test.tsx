import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AdminNav, adminNavItems } from "../components/layout/admin-nav";

describe("Admin Console Navigation & Route Structure", () => {
  it("renders all defined administrative navigation destinations", () => {
    render(<AdminNav collapsed={false} />);

    // Verify key domain routes are rendered
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Products & Apparel")).toBeInTheDocument();
    expect(screen.getByText("Fashion Categories")).toBeInTheDocument();
    expect(screen.getByText("Inventory & Stock")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Shipments & Fulfillment")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("Customer Reviews")).toBeInTheDocument();
    expect(screen.getByText("Staff & Team")).toBeInTheDocument();
    expect(screen.getByText("Roles & Permissions")).toBeInTheDocument();
    expect(screen.getByText("Security Audit")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("matches total count of navigation links defined in items config", () => {
    render(<AdminNav collapsed={false} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(adminNavItems.length);
  });

  it("renders compact icon-only representation when collapsed is true", () => {
    render(<AdminNav collapsed={true} />);

    // In collapsed mode, text labels are not rendered in DOM spans
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Products & Apparel")).not.toBeInTheDocument();

    // But all link elements remain accessible
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(adminNavItems.length);
  });
});
