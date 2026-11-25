import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useAdminAuthStore } from "../stores/admin-auth-store";
import { AdminAuthProvider } from "../providers/auth-provider";
import { AdminProtectedRoute } from "../components/common/admin-protected-route";
import { adminAuthApi } from "../lib/api/admin-auth-api";
import { ApiClientError } from "../lib/api/api-client";
import { AuthUser } from "@veyora/types";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/inventory",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Admin Console — Session Persistence & Refresh Token Lifecycle", () => {
  const mockAdminUser: AuthUser = {
    id: "admin-77",
    email: "operator@veyora.com",
    firstName: "Vikram",
    lastName: "Singh",
    role: "admin",
    permissions: ["INVENTORY_READ", "INVENTORY_WRITE"],
    isEmailVerified: true,
  };

  const mockSuperAdminUser: AuthUser = {
    id: "superadmin-01",
    email: "super@veyora.com",
    firstName: "Ananya",
    lastName: "Deshmukh",
    role: "superadmin",
    permissions: ["*"],
    isEmailVerified: true,
  };

  const mockCustomerUser: AuthUser = {
    id: "cust-101",
    email: "intruder@gmail.com",
    firstName: "Random",
    lastName: "Shopper",
    role: "customer",
    permissions: [],
    isEmailVerified: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAdminAuthStore.setState({
      status: "initializing",
      admin: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. login stores access token in Zustand memory only, never in localStorage", () => {
    const accessToken = "admin-jwt-live-token";
    useAdminAuthStore.getState().setAdminAuth(mockAdminUser, accessToken);

    const state = useAdminAuthStore.getState();
    expect(state.accessToken).toBe(accessToken);
    expect(state.admin?.email).toBe("operator@veyora.com");
    expect(state.isAuthenticated).toBe(true);

    expect(window.localStorage.getItem("accessToken")).toBeNull();
    expect(window.localStorage.getItem("refreshToken")).toBeNull();
  });

  it("2. AdminProtectedRoute renders AdminAuthLoadingScreen while initializing without redirecting", () => {
    useAdminAuthStore.getState().setStatus("initializing");

    render(
      <AdminProtectedRoute>
        <div data-testid="admin-panel">Inventory Table</div>
      </AdminProtectedRoute>
    );

    expect(screen.getByTestId("admin-auth-loading-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-panel")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("3. AdminAuthProvider restores administrator session on reload", async () => {
    vi.spyOn(adminAuthApi, "refreshToken").mockResolvedValueOnce({
      user: mockAdminUser,
      accessToken: "refreshed-admin-jwt",
      expiresIn: 900,
    });

    render(
      <AdminAuthProvider>
        <div data-testid="admin-app">Admin Console Loaded</div>
      </AdminAuthProvider>
    );

    await waitFor(() => {
      const state = useAdminAuthStore.getState();
      expect(state.status).toBe("authenticated");
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe("refreshed-admin-jwt");
      expect(state.admin?.role).toBe("admin");
    });
  });

  it("4. customer role is rejected from admin restoration and cannot enter console", async () => {
    vi.spyOn(adminAuthApi, "refreshToken").mockResolvedValueOnce({
      user: mockCustomerUser,
      accessToken: "customer-jwt-token",
      expiresIn: 900,
    });

    render(
      <AdminAuthProvider>
        <AdminProtectedRoute>
          <div data-testid="admin-restricted">Protected Content</div>
        </AdminProtectedRoute>
      </AdminAuthProvider>
    );

    await waitFor(() => {
      const state = useAdminAuthStore.getState();
      expect(state.status).toBe("unauthenticated");
      expect(state.isAuthenticated).toBe(false);
      expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Finventory");
    });
  });

  it("5. superadmin role restores session and retains full administrator access", async () => {
    vi.spyOn(adminAuthApi, "refreshToken").mockResolvedValueOnce({
      user: mockSuperAdminUser,
      accessToken: "superadmin-jwt-token",
      expiresIn: 900,
    });

    render(
      <AdminAuthProvider>
        <AdminProtectedRoute>
          <div data-testid="superadmin-content">Full Operations Console</div>
        </AdminProtectedRoute>
      </AdminAuthProvider>
    );

    await waitFor(() => {
      const state = useAdminAuthStore.getState();
      expect(state.status).toBe("authenticated");
      expect(state.admin?.role).toBe("superadmin");
      expect(screen.getByTestId("superadmin-content")).toBeInTheDocument();
    });
  });

  it("6. temporary network failure renders connection error UI with retry action", async () => {
    vi.spyOn(adminAuthApi, "refreshToken").mockRejectedValueOnce(
      new ApiClientError("Network connection refused", 0, "NETWORK_ERROR")
    );

    render(
      <AdminAuthProvider>
        <AdminProtectedRoute>
          <div data-testid="admin-panel">Admin Panel</div>
        </AdminProtectedRoute>
      </AdminAuthProvider>
    );

    await waitFor(() => {
      const state = useAdminAuthStore.getState();
      expect(state.status).toBe("error");
      expect(screen.getByTestId("admin-auth-connection-error")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("7. logout clears admin credentials and in-memory store", () => {
    useAdminAuthStore.getState().setAdminAuth(mockAdminUser, "token-123");
    expect(useAdminAuthStore.getState().isAuthenticated).toBe(true);

    act(() => {
      useAdminAuthStore.getState().clearAdminAuth();
    });

    const state = useAdminAuthStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.isAuthenticated).toBe(false);
    expect(state.admin).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
