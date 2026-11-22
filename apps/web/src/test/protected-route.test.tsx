import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ProtectedRoute } from "../components/common/protected-route";
import { useAuthStore } from "../stores/auth-store";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/profile/orders",
}));

describe("ProtectedRoute — Initial Loading & Route Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  it("renders AuthLoadingScreen and does NOT redirect to /login while initializing", () => {
    useAuthStore.getState().setStatus("initializing");

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("auth-loading-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to login with preserved redirect query when unauthenticated", () => {
    useAuthStore.getState().setUnauthenticated();

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Fprofile%2Forders");
  });

  it("renders protected content immediately when authenticated", () => {
    useAuthStore.getState().setAuth(
      {
        id: "usr-01",
        email: "member@veyora.com",
        firstName: "Aria",
        lastName: "Vane",
        role: "customer",
        permissions: [],
        isEmailVerified: true,
      },
      "valid-access-token"
    );

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
