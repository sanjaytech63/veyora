import type { Metadata } from "next";
import { AppProviders } from "@/providers/app-providers";
import { AdminLayout } from "@/components/layout/admin-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Veyora — Administration Portal",
    template: "%s | Veyora Administration",
  },
  description:
    "Executive commerce operations, inventory control, and customer management console for Veyora Atelier.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <AppProviders>
          <AdminLayout>{children}</AdminLayout>
        </AppProviders>
      </body>
    </html>
  );
}
