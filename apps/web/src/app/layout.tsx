import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { StoreLayout } from "@/components/layout/store-layout";
import { WebSiteJsonLd } from "@/components/storefront/json-ld";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veyora.store";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Veyora — Minimal Fashion & Precision Hardware",
    template: "%s | Veyora",
  },
  description:
    "Minimalist, editorial fashion & precision hardware e-commerce platform. Designed for tactile clarity, enduring aesthetics, and acoustic excellence.",
  keywords: [
    "minimal fashion",
    "precision hardware",
    "acoustic listening",
    "desk instruments",
    "curated fashion",
    "veyora atelier",
  ],
  authors: [{ name: "Veyora Atelier" }],
  creator: "Veyora",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Veyora Atelier",
    title: "Veyora — Minimal Fashion & Precision Hardware",
    description:
      "Minimalist, editorial fashion & precision hardware e-commerce platform. Designed for tactile clarity, enduring aesthetics, and acoustic excellence.",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Veyora Atelier Storefront",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Veyora — Minimal Fashion & Precision Hardware",
    description:
      "Minimalist, editorial fashion & precision hardware e-commerce platform. Designed for tactile clarity and enduring aesthetics.",
    creator: "@veyora",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <WebSiteJsonLd />
        <AppProviders>
          <StoreLayout>{children}</StoreLayout>
        </AppProviders>
      </body>
    </html>
  );
}
