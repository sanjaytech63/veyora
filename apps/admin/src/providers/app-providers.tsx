"use client";

import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { AdminAuthProvider } from "./auth-provider";
import { AdminSocketProvider } from "./socket-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <AdminAuthProvider>
          <AdminSocketProvider>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster position="top-center" closeButton />
            </TooltipProvider>
          </AdminSocketProvider>
        </AdminAuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
