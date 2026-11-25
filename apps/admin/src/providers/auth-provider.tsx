"use client";

import * as React from "react";
import { useAdminAuthStore } from "@/stores/admin-auth-store";
import { adminAuthApi } from "@/lib/api/admin-auth-api";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  // Use narrow action selectors so AdminAuthProvider never re-renders on auth state changes
  const setAdminAuth = useAdminAuthStore((s) => s.setAdminAuth);
  const setUnauthenticated = useAdminAuthStore((s) => s.setUnauthenticated);
  const initRef = React.useRef(false);

  React.useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function restoreSession() {
      const currentStatus = useAdminAuthStore.getState().status;
      if (currentStatus === "authenticated") {
        return;
      }

      try {
        const response = await adminAuthApi.refreshToken();
        if (
          response &&
          response.user &&
          response.accessToken &&
          (response.user.role === "admin" || response.user.role === "superadmin")
        ) {
          setAdminAuth(response.user, response.accessToken);
          return;
        }
        setUnauthenticated();
      } catch {
        setUnauthenticated();
      }
    }

    restoreSession();
  }, [setAdminAuth, setUnauthenticated]);

  return <>{children}</>;
}
