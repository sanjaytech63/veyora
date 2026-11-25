import { create } from "zustand";
import { AuthUser } from "@veyora/types";
import { apiClient } from "@/lib/api/api-client";
import { authApi } from "@/lib/api/auth-api";
import { clearQueryClient } from "@/lib/api/query-client";

export type AuthStatus =
  "initializing" | "authenticated" | "unauthenticated" | "refreshing" | "error";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  setStatus: (status: AuthStatus) => void;
  setUnauthenticated: () => void;
  setError: (error: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "initializing",
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setAuth: (user, accessToken) => {
    set({
      status: "authenticated",
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    // Notify other browser tabs that an active session was established
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel("veyora_web_auth");
        channel.postMessage({ type: "SESSION_SYNC" });
        channel.close();
      } catch {
        // Silently ignore channel errors in restrictive sandboxes
      }
    }
  },

  setUser: (user) => set({ user }),

  clearAuth: () => {
    clearQueryClient();
    set({
      status: "unauthenticated",
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Broadcast session logout notification to other open tabs
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel("veyora_web_auth");
        channel.postMessage({ type: "LOGOUT" });
        channel.close();
      } catch {
        // Silently ignore channel errors in restrictive sandboxes
      }
    }
  },

  setUnauthenticated: () => {
    clearQueryClient();
    set({
      status: "unauthenticated",
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  setError: (error) =>
    set({
      status: "error",
      error,
      isLoading: false,
      isAuthenticated: false,
    }),

  setLoading: (isLoading) =>
    set({
      isLoading,
      status: isLoading
        ? "initializing"
        : get().status === "authenticated"
          ? "authenticated"
          : "unauthenticated",
    }),

  setStatus: (status) =>
    set({
      status,
      isLoading: status === "initializing" || status === "refreshing",
      isAuthenticated: status === "authenticated",
      error: status === "error" ? get().error : null,
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
