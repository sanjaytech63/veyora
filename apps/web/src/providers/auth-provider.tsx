"use client";

import * as React from "react";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth-api";
import { ApiClientError } from "@/lib/api/api-client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);
  const setError = useAuthStore((s) => s.setError);
  const setStatus = useAuthStore((s) => s.setStatus);
  const initRef = React.useRef(false);

  React.useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function restoreSession() {
      const currentStatus = useAuthStore.getState().status;
      if (currentStatus === "authenticated") {
        return;
      }

      setStatus("initializing");

      try {
        const response = await authApi.refreshToken();
        if (response && response.user && response.accessToken) {
          setAuth(response.user, response.accessToken);
          return;
        }
        setUnauthenticated();
      } catch (err) {
        if (err instanceof ApiClientError) {
          // 401 or 403 means genuinely unauthenticated, revoked, or expired session
          if (err.statusCode === 401 || err.statusCode === 403) {
            setUnauthenticated();
            return;
          }
          // Network errors (statusCode === 0) or server outages (5xx)
          if (err.statusCode === 0 || err.statusCode >= 500) {
            setError(err.message || "Unable to connect to authentication service.");
            return;
          }
        }
        // Fallback for unhandled unexpected errors
        setUnauthenticated();
      }
    }

    restoreSession();

    // Multi-tab synchronization via BroadcastChannel
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("veyora_web_auth");
      channel.onmessage = (event) => {
        if (event.data?.type === "LOGOUT") {
          useAuthStore.getState().clearAuth();
        } else if (event.data?.type === "SESSION_SYNC") {
          const status = useAuthStore.getState().status;
          if (status !== "authenticated") {
            restoreSession();
          }
        }
      };
      return () => {
        channel.close();
      };
    }
  }, [setAuth, setUnauthenticated, setError, setStatus]);

  return <>{children}</>;
}
