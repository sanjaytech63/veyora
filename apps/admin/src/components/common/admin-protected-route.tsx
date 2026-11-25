"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuthStore } from "@/stores/admin-auth-store";
import { AdminAuthLoadingScreen } from "./admin-auth-loading-screen";
import { adminAuthApi } from "@/lib/api/admin-auth-api";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isAuthenticated, status, isLoading, error } = useAdminAuthStore();

  const isInitializing = status === "initializing" || isLoading;

  React.useEffect(() => {
    // Skip protection on login page itself
    if (pathname === "/login") return;

    if (
      !isInitializing &&
      status === "unauthenticated" &&
      (!isAuthenticated || !admin || (admin.role !== "admin" && admin.role !== "superadmin"))
    ) {
      const redirectQuery =
        pathname && pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : "";
      const destination = `/login${redirectQuery}`;
      router.push(destination);
    }
  }, [admin, isAuthenticated, isInitializing, pathname, router, status]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (isInitializing) {
    return <AdminAuthLoadingScreen message="Verifying administrator permissions..." />;
  }

  if (status === "error") {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center"
        data-testid="admin-auth-connection-error"
      >
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Administrator Service Connection Error
        </h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {error ||
            "Unable to reach the administrator authentication service. Please check your connection and retry."}
        </p>
        <button
          type="button"
          onClick={() => {
            useAdminAuthStore.getState().setStatus("initializing");
            adminAuthApi.refreshToken().then(
              (res) => {
                if (
                  res &&
                  res.user &&
                  (res.user.role === "admin" || res.user.role === "superadmin")
                ) {
                  useAdminAuthStore.getState().setAdminAuth(res.user, res.accessToken);
                } else {
                  useAdminAuthStore.getState().setUnauthenticated();
                }
              },
              (err) => {
                if (err?.statusCode === 401 || err?.statusCode === 403) {
                  useAdminAuthStore.getState().setUnauthenticated();
                } else {
                  useAdminAuthStore.getState().setError(err?.message || "Connection failed");
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

  if (!isAuthenticated || !admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
    return <AdminAuthLoadingScreen message="Redirecting to administrator sign in..." />;
  }

  return <>{children}</>;
}
