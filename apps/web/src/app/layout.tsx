import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veyora — Customer Storefront",
  description:
    "Scalable modern e-commerce storefront foundation built with Next.js App Router and Tailwind CSS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
