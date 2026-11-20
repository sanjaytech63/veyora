import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veyora — Administration Portal",
  description:
    "Scalable modern administrative portal foundation built with Next.js App Router and Tailwind CSS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
