import type { Metadata } from "next";
import { AppProviders } from "@/providers/app-providers";
import { AdminLayout } from "@/components/layout/admin-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veyora — Administration Portal",
  description:
    "Enterprise-grade modern administration portal foundation built with Next.js App Router, Tailwind CSS v4, and shadcn/ui.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <AppProviders>
          <AdminLayout>{children}</AdminLayout>
        </AppProviders>
      </body>
    </html>
  );
}
