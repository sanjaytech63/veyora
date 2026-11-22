import { create } from "zustand";
import { AuthUser } from "@veyora/types";
import { apiClient } from "@/lib/api/api-client";
import { adminAuthApi } from "@/lib/api/admin-auth-api";

export type AdminAuthStatus = "initializing" | "authenticated" | "unauthenticated";

export interface AdminAuthState {
  status: AdminAuthStatus;
  admin: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAdminAuth: (admin: AuthUser, accessToken: string) => void;
  setAdmin: (admin: AuthUser) => void;
  clearAdminAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  setStatus: (status: AdminAuthStatus) => void;
  setUnauthenticated: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  status: "initializing",
  admin: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAdminAuth: (admin, accessToken) =>
    set({
      status: "authenticated",
      admin,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  setAdmin: (admin) => set({ admin }),

  clearAdminAuth: () =>
    set({
      status: "unauthenticated",
      admin: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setUnauthenticated: () =>
    set({
      status: "unauthenticated",
      admin: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (isLoading) =>
    set({
      isLoading,
      status: isLoading ? "initializing" : "unauthenticated",
    }),

  setStatus: (status) =>
    set({
      status,
      isLoading: status === "initializing",
      isAuthenticated: status === "authenticated",
    }),
}));

// Wire ApiClient auth token provider to current accessToken in Admin Zustand
apiClient.setAuthTokenProvider(() => useAdminAuthStore.getState().accessToken);

// Wire ApiClient session expiration handler
apiClient.setOnSessionExpired(() => {
  useAdminAuthStore.getState().clearAdminAuth();
});

// Wire ApiClient refresh token handler
apiClient.setRefreshTokenHandler(async () => {
  try {
    const res = await adminAuthApi.refreshToken();
    if (
      res &&
      res.user &&
      res.accessToken &&
      (res.user.role === "admin" || res.user.role === "superadmin")
    ) {
      useAdminAuthStore.getState().setAdminAuth(res.user, res.accessToken);
      return res.accessToken;
    }
    useAdminAuthStore.getState().clearAdminAuth();
    return null;
  } catch {
    useAdminAuthStore.getState().clearAdminAuth();
    return null;
  }
});
