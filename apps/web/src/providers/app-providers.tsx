"use client";

import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { SocketProvider } from "./socket-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <SocketProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster position="top-center" closeButton />
          </TooltipProvider>
        </SocketProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
