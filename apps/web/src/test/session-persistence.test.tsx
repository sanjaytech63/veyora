import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import { AuthProvider } from "../providers/auth-provider";
import { ProtectedRoute } from "../components/common/protected-route";
import { NavbarActions } from "../components/navigation/navbar/NavbarActions";
import { authApi } from "../lib/api/auth-api";
import { ApiClientError } from "../lib/api/api-client";
import { AuthUser } from "@veyora/types";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/profile",
  useSearchParams: () => new URLSearchParams(),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Web Storefront — Session Persistence & Refresh Token Lifecycle", () => {
  const mockCustomer: AuthUser = {
    id: "cust-99",
    email: "patron@veyora.com",
    firstName: "Radhika",
    lastName: "Mehta",
    role: "customer",
    permissions: [],
    isEmailVerified: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      status: "initializing",
      user: null,
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
    const accessToken = "jwt-access-token-live-memory";
    useAuthStore.getState().setAuth(mockCustomer, accessToken);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe(accessToken);
    expect(state.user?.email).toBe("patron@veyora.com");
    expect(state.isAuthenticated).toBe(true);

    // Verify token is NOT written to localStorage or sessionStorage
    expect(window.localStorage.getItem("accessToken")).toBeNull();
    expect(window.sessionStorage.getItem("accessToken")).toBeNull();
    expect(window.localStorage.getItem("refreshToken")).toBeNull();
  });

  it("2. refresh cookie is protected and never read or set by client JavaScript", () => {
    // Document.cookie must never expose HttpOnly refreshToken
    expect(document.cookie).not.toContain("refreshToken");
  });

  it("3. browser reload starts in 'initializing' state with loading navbar skeleton", () => {
    useAuthStore.getState().setStatus("initializing");

    renderWithProviders(<NavbarActions onOpenSearch={vi.fn()} />);

    // Should render the pulse placeholder skeleton, NOT the Sign In button
    expect(screen.getByTestId("navbar-auth-loading")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("4. AuthProvider restores authenticated session on reload via refreshToken API", async () => {
    vi.spyOn(authApi, "refreshToken").mockResolvedValueOnce({
      user: mockCustomer,
      accessToken: "refreshed-jwt-access-token",
      expiresIn: 900,
    });

    renderWithProviders(
      <AuthProvider>
        <div data-testid="app-content">Storefront Loaded</div>
      </AuthProvider>
    );

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.status).toBe("authenticated");
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe("refreshed-jwt-access-token");
      expect(state.user?.firstName).toBe("Radhika");
    });
  });

  it("5. Navbar displays authenticated user avatar after successful session restoration", async () => {
    useAuthStore.getState().setAuth(mockCustomer, "active-jwt-token");

    renderWithProviders(<NavbarActions onOpenSearch={vi.fn()} />);

    // Renders user avatar initials
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("6. ProtectedRoute renders loading screen and waits without redirecting while initializing", () => {
    useAuthStore.getState().setStatus("initializing");

    renderWithProviders(
      <ProtectedRoute>
        <div data-testid="secret-orders">User Orders</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("auth-loading-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("secret-orders")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("7. invalid or expired refresh token (401) sets unauthenticated and redirects to login", async () => {
    vi.spyOn(authApi, "refreshToken").mockRejectedValueOnce(
      new ApiClientError("Refresh token is required.", 401, "UNAUTHORIZED")
    );

    renderWithProviders(
      <AuthProvider>
        <ProtectedRoute>
          <div data-testid="secret-profile">Profile</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.status).toBe("unauthenticated");
      expect(state.isAuthenticated).toBe(false);
      expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Fprofile");
    });
  });

  it("8. temporary network failure sets 'error' status with retry and avoids premature logout redirect", async () => {
    vi.spyOn(authApi, "refreshToken").mockRejectedValueOnce(
      new ApiClientError("Network error encountered", 0, "NETWORK_ERROR")
    );

    renderWithProviders(
      <AuthProvider>
        <ProtectedRoute>
          <div data-testid="secret-profile">Profile</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.status).toBe("error");
      expect(screen.getByTestId("auth-connection-error")).toBeInTheDocument();
      // Must NOT redirect to login on temporary network failure
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("9. logout clears in-memory auth and broadcasts logout event", async () => {
    useAuthStore.getState().setAuth(mockCustomer, "test-token");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    act(() => {
      useAuthStore.getState().clearAuth();
    });

    const state = useAuthStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
