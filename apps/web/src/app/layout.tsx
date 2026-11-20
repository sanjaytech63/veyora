import type { Metadata } from "next";
import { AppProviders } from "@/providers/app-providers";
import { StoreLayout } from "@/components/layout/store-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veyora — Customer Storefront",
  description:
    "Enterprise-grade modern e-commerce storefront foundation built with Next.js App Router, Tailwind CSS v4, and shadcn/ui.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <AppProviders>
          <StoreLayout>{children}</StoreLayout>
        </AppProviders>
      </body>
    </html>
  );
}
