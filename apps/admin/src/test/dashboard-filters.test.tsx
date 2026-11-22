import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { DashboardDateFilter } from "../components/dashboard/dashboard-date-filter";

describe("Admin Dashboard Reporting Filters & Date Range Controls", () => {
  it("displays current period selection button label", () => {
    render(
      <DashboardDateFilter
        period="30d"
        onPeriodChange={vi.fn()}
      />
    );

    expect(screen.getByText("Last 30 Days")).toBeInTheDocument();
  });

  it("displays custom range inputs when period is custom", () => {
    const onCustomChange = vi.fn();
    render(
      <DashboardDateFilter
        period="custom"
        onPeriodChange={vi.fn()}
        startDate="2026-01-01"
        endDate="2026-01-31"
        onCustomDateChange={onCustomChange}
      />
    );

    expect(screen.getByText("Custom Range")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-01-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-01-31")).toBeInTheDocument();

    const applyBtn = screen.getByRole("button", { name: /apply/i });
    fireEvent.click(applyBtn);
    expect(onCustomChange).toHaveBeenCalledWith("2026-01-01", "2026-01-31");
  });
});
