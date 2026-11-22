import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AdminProtectedRoute } from "../components/common/admin-protected-route";
import { useAdminAuthStore } from "../stores/admin-auth-store";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/products",
}));

describe("AdminProtectedRoute — Initial Loading & Route Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminAuthStore.getState().clearAdminAuth();
  });

  it("renders AdminAuthLoadingScreen and does NOT redirect to /login while initializing", () => {
    useAdminAuthStore.getState().setStatus("initializing");

    render(
      <AdminProtectedRoute>
        <div data-testid="admin-content">Admin Dashboard Area</div>
      </AdminProtectedRoute>
    );

    expect(screen.getByTestId("admin-auth-loading-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to login with preserved redirect query when unauthenticated", () => {
    useAdminAuthStore.getState().setUnauthenticated();

    render(
      <AdminProtectedRoute>
        <div data-testid="admin-content">Admin Dashboard Area</div>
      </AdminProtectedRoute>
    );

    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Fproducts");
  });

  it("renders admin content when authenticated with admin role", () => {
    useAdminAuthStore.getState().setAdminAuth(
      {
        id: "adm-01",
        email: "super@veyora.com",
        firstName: "Super",
        lastName: "Admin",
        role: "admin",
        permissions: [],
        isEmailVerified: true,
      },
      "valid-admin-token"
    );

    render(
      <AdminProtectedRoute>
        <div data-testid="admin-content">Admin Dashboard Area</div>
      </AdminProtectedRoute>
    );

    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
