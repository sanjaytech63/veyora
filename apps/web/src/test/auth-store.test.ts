import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../stores/auth-store";
import { AuthUser } from "@veyora/types";

describe("Storefront Authentication State Management", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  const mockUser: AuthUser = {
    id: "user-storefront-01",
    email: "shikha.patel@example.com",
    firstName: "Shikha",
    lastName: "Patel",
    role: "customer",
    permissions: [],
    isEmailVerified: true,
  };

  it("initializes with unauthenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it("sets user and token on successful authentication", () => {
    useAuthStore.getState().setAuth(mockUser, "test-jwt-access-token-xyz");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe("test-jwt-access-token-xyz");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it("updates user profile without altering token or auth status", () => {
    useAuthStore.getState().setAuth(mockUser, "test-jwt-access-token-xyz");

    const updatedUser: AuthUser = {
      ...mockUser,
      firstName: "Shikha Updated",
    };

    useAuthStore.getState().setUser(updatedUser);

    const state = useAuthStore.getState();
    expect(state.user?.firstName).toBe("Shikha Updated");
    expect(state.accessToken).toBe("test-jwt-access-token-xyz");
    expect(state.isAuthenticated).toBe(true);
  });

  it("clears auth credentials on logout", () => {
    useAuthStore.getState().setAuth(mockUser, "test-jwt-access-token-xyz");
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("manages loading state flags", () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
