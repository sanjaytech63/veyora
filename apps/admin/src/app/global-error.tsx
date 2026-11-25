"use client";

import * as React from "react";
import Link from "next/link";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminGlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    console.error("Admin Root Critical Error [digest: %s]:", error.digest || "none");
  }, [error]);

  const isProduction = process.env.NODE_ENV === "production";
  const hasSensitiveData = /mongodb|postgres|mysql|redis|jwt|bearer|password|secret|key/i.test(
    error.message || ""
  );

  const displayMessage =
    isProduction || hasSensitiveData
      ? "A critical layout error occurred in the administrative management tree. You may retry the layout or return to the root console."
      : error.message ||
        "A critical error occurred while initializing the administrative layout tree.";

  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased flex items-center justify-center p-6 font-sans">
        <main
          role="alert"
          aria-live="assertive"
          aria-labelledby="admin-global-error-heading"
          aria-describedby="admin-global-error-desc"
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-red-950/60 text-red-400 border border-red-800/60">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              Critical Portal Fault
            </span>
            <h1
              id="admin-global-error-heading"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
            >
              Root Console Crash
            </h1>
            <p
              id="admin-global-error-desc"
              className="text-xs sm:text-sm text-zinc-400 leading-relaxed"
            >
              {displayMessage}
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-zinc-500 pt-1">Digest: {error.digest}</p>
            )}
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
              aria-label="Retry loading administrative root layout"
            >
              Retry Layout
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-semibold hover:bg-zinc-900 transition-colors focus:outline-hidden focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              Console Root
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
