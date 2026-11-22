import { create } from "zustand";
import { AuthUser } from "@veyora/types";
import { apiClient } from "@/lib/api/api-client";
import { authApi } from "@/lib/api/auth-api";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  setStatus: (status: AuthStatus) => void;
  setUnauthenticated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "initializing",
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) =>
    set({
      status: "authenticated",
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  setUser: (user) => set({ user }),

  clearAuth: () =>
    set({
      status: "unauthenticated",
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setUnauthenticated: () =>
    set({
      status: "unauthenticated",
      user: null,
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

// Wire ApiClient auth token provider to current accessToken in Zustand
apiClient.setAuthTokenProvider(() => useAuthStore.getState().accessToken);

// Wire ApiClient session expiration handler
apiClient.setOnSessionExpired(() => {
  useAuthStore.getState().clearAuth();
});

// Wire ApiClient refresh token handler
apiClient.setRefreshTokenHandler(async () => {
  try {
    const res = await authApi.refreshToken();
    if (res && res.user && res.accessToken) {
      useAuthStore.getState().setAuth(res.user, res.accessToken);
      return res.accessToken;
    }
    useAuthStore.getState().clearAuth();
    return null;
  } catch {
    useAuthStore.getState().clearAuth();
    return null;
  }
});
