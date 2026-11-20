import { create } from "zustand";
import { AuthUser } from "@veyora/types";
import { apiClient } from "@/lib/api/api-client";

interface AdminAuthState {
  admin: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAdminAuth: (admin: AuthUser, accessToken: string) => void;
  setAdmin: (admin: AuthUser) => void;
  clearAdminAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  admin: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  setAdminAuth: (admin, accessToken) =>
    set({
      admin,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  setAdmin: (admin) => set({ admin }),

  clearAdminAuth: () =>
    set({
      admin: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));

// Wire ApiClient auth token provider to current accessToken in Admin Zustand
apiClient.setAuthTokenProvider(() => useAdminAuthStore.getState().accessToken);
