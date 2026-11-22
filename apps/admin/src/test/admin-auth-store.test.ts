import { describe, it, expect, beforeEach } from "vitest";
import { useAdminAuthStore } from "../stores/admin-auth-store";
import { AuthUser } from "@veyora/types";

describe("Admin Console Authentication State Management", () => {
  beforeEach(() => {
    useAdminAuthStore.getState().clearAdminAuth();
  });

  const mockAdmin: AuthUser = {
    id: "admin-staff-01",
    email: "catalog.manager@veyora.com",
    firstName: "Priya",
    lastName: "Sharma",
    role: "admin",
    permissions: ["CATALOG_READ", "CATALOG_WRITE"],
    isEmailVerified: true,
  };

  it("clears auth to unauthenticated state", () => {
    const state = useAdminAuthStore.getState();
    expect(state.admin).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.status).toBe("unauthenticated");
  });

  it("sets admin user, token and authenticated status on successful login", () => {
    useAdminAuthStore.getState().setAdminAuth(mockAdmin, "admin-jwt-token-999");

    const state = useAdminAuthStore.getState();
    expect(state.admin).toEqual(mockAdmin);
    expect(state.accessToken).toBe("admin-jwt-token-999");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.status).toBe("authenticated");
  });

  it("updates admin profile details without altering token or auth status", () => {
    useAdminAuthStore.getState().setAdminAuth(mockAdmin, "admin-jwt-token-999");

    const updatedAdmin: AuthUser = {
      ...mockAdmin,
      firstName: "Priya Updated",
    };

    useAdminAuthStore.getState().setAdmin(updatedAdmin);

    const state = useAdminAuthStore.getState();
    expect(state.admin?.firstName).toBe("Priya Updated");
    expect(state.accessToken).toBe("admin-jwt-token-999");
    expect(state.isAuthenticated).toBe(true);
    expect(state.status).toBe("authenticated");
  });

  it("clears admin credentials on logout", () => {
    useAdminAuthStore.getState().setAdminAuth(mockAdmin, "admin-jwt-token-999");
    useAdminAuthStore.getState().clearAdminAuth();

    const state = useAdminAuthStore.getState();
    expect(state.admin).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.status).toBe("unauthenticated");
  });

  it("supports explicit 3-state transitions (initializing -> authenticated -> unauthenticated)", () => {
    useAdminAuthStore.getState().setStatus("initializing");
    expect(useAdminAuthStore.getState().status).toBe("initializing");
    expect(useAdminAuthStore.getState().isLoading).toBe(true);
    expect(useAdminAuthStore.getState().isAuthenticated).toBe(false);

    useAdminAuthStore.getState().setAdminAuth(mockAdmin, "admin-tok-456");
    expect(useAdminAuthStore.getState().status).toBe("authenticated");
    expect(useAdminAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAdminAuthStore.getState().isLoading).toBe(false);

    useAdminAuthStore.getState().setUnauthenticated();
    expect(useAdminAuthStore.getState().status).toBe("unauthenticated");
    expect(useAdminAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAdminAuthStore.getState().admin).toBeNull();
  });
});
