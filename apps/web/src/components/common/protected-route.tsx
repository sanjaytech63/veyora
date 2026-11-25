"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AuthLoadingScreen } from "./auth-loading-screen";
import { authApi } from "@/lib/api/auth-api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, status, isLoading, error } = useAuthStore();

  const isInitializing = status === "initializing" || isLoading;

  React.useEffect(() => {
    if (!isInitializing && status === "unauthenticated" && !isAuthenticated) {
      const redirectQuery =
        pathname && pathname !== "/" && pathname !== "/account" && pathname !== "/login"
          ? `?redirect=${encodeURIComponent(pathname)}`
          : "";
      router.push(`/login${redirectQuery}`);
    }
  }, [isAuthenticated, isInitializing, pathname, router, status]);

  if (isInitializing) {
    return <AuthLoadingScreen message="Verifying authentication..." />;
  }

  if (status === "error") {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center"
        data-testid="auth-connection-error"
      >
        <h2 className="text-lg font-semibold text-foreground mb-2">Connection Problem</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {error ||
            "Unable to reach the authentication service. Please check your connection and retry."}
        </p>
        <button
          type="button"
          onClick={() => {
            useAuthStore.getState().setStatus("initializing");
            authApi.refreshToken().then(
              (res) => {
                if (res && res.user && res.accessToken) {
                  useAuthStore.getState().setAuth(res.user, res.accessToken);
                } else {
                  useAuthStore.getState().setUnauthenticated();
                }
              },
              (err) => {
                if (err?.statusCode === 401 || err?.statusCode === 403) {
                  useAuthStore.getState().setUnauthenticated();
                } else {
                  useAuthStore.getState().setError(err?.message || "Connection failed");
                }
              }
            );
          }}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthLoadingScreen message="Redirecting to sign in..." />;
  }

  return <>{children}</>;
}
