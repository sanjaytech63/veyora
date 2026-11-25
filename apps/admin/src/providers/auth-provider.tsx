"use client";

import * as React from "react";
import { useAdminAuthStore } from "@/stores/admin-auth-store";
import { adminAuthApi } from "@/lib/api/admin-auth-api";
import { ApiClientError } from "@/lib/api/api-client";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const setAdminAuth = useAdminAuthStore((s) => s.setAdminAuth);
  const setUnauthenticated = useAdminAuthStore((s) => s.setUnauthenticated);
  const setError = useAdminAuthStore((s) => s.setError);
  const setStatus = useAdminAuthStore((s) => s.setStatus);
  const initRef = React.useRef(false);

  React.useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function restoreSession() {
      const currentStatus = useAdminAuthStore.getState().status;
      if (currentStatus === "authenticated") {
        return;
      }

      setStatus("initializing");

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
      } catch (err) {
        if (err instanceof ApiClientError) {
          if (err.statusCode === 401 || err.statusCode === 403) {
            setUnauthenticated();
            return;
          }
          if (err.statusCode === 0 || err.statusCode >= 500) {
            setError(err.message || "Unable to connect to administrator authentication service.");
            return;
          }
        }
        setUnauthenticated();
      }
    }

    restoreSession();

    // Multi-tab synchronization via BroadcastChannel
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("veyora_admin_auth");
      channel.onmessage = (event) => {
        if (event.data?.type === "LOGOUT") {
          useAdminAuthStore.getState().clearAdminAuth();
        } else if (event.data?.type === "SESSION_SYNC") {
          const status = useAdminAuthStore.getState().status;
          if (status !== "authenticated") {
            restoreSession();
          }
        }
      };
      return () => {
        channel.close();
      };
    }
  }, [setAdminAuth, setUnauthenticated, setError, setStatus]);

  return <>{children}</>;
}
