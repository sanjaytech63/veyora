"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuthStore } from "@/stores/admin-auth-store";
import { AdminAuthLoadingScreen } from "./admin-auth-loading-screen";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isAuthenticated, status, isLoading } = useAdminAuthStore();

  const isInitializing = status === "initializing" || isLoading;

  React.useEffect(() => {
    // Skip protection on login page itself
    if (pathname === "/login") return;

    if (
      !isInitializing &&
      (!isAuthenticated || !admin || (admin.role !== "admin" && admin.role !== "superadmin"))
    ) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [admin, isAuthenticated, isInitializing, pathname, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (isInitializing) {
    return <AdminAuthLoadingScreen message="Verifying administrator permissions..." />;
  }

  if (!isAuthenticated || !admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
    return null;
  }

  return <>{children}</>;
}
