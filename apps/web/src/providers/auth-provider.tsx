"use client";

import * as React from "react";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth-api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use narrow action selectors so AuthProvider never re-renders on auth state changes
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);
  const initRef = React.useRef(false);

  React.useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function restoreSession() {
      // If already authenticated (e.g. from tests or prior setup), skip
      const currentStatus = useAuthStore.getState().status;
      if (currentStatus === "authenticated") {
        return;
      }

      try {
        const response = await authApi.refreshToken();
        if (response && response.user && response.accessToken) {
          setAuth(response.user, response.accessToken);
          return;
        }
        setUnauthenticated();
      } catch {
        setUnauthenticated();
      }
    }

    restoreSession();
  }, [setAuth, setUnauthenticated]);

  return <>{children}</>;
}
