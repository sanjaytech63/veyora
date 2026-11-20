import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../badge";

describe("Badge UI Component", () => {
  it("renders badge text correctly", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies success variant classes", () => {
    render(<Badge variant="success">Completed</Badge>);
    const badge = screen.getByText("Completed");
    expect(badge.className).toContain("bg-emerald-100");
  });
});
