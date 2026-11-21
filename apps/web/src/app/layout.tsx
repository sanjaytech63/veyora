import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { StoreLayout } from "@/components/layout/store-layout";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Veyora — Minimal Fashion & Precision Hardware",
  description:
    "Minimalist, editorial fashion & precision hardware e-commerce platform. Designed for tactile clarity and enduring aesthetics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <AppProviders>
          <StoreLayout>{children}</StoreLayout>
        </AppProviders>
      </body>
    </html>
  );
}
