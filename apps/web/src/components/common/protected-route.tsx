"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AuthLoadingScreen } from "./auth-loading-screen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, status, isLoading } = useAuthStore();

  const isInitializing = status === "initializing" || isLoading;

  React.useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isInitializing, pathname, router]);

  if (isInitializing) {
    return <AuthLoadingScreen message="Verifying authentication..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
