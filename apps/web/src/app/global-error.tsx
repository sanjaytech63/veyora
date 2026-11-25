"use client";

import * as React from "react";
import Link from "next/link";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    console.error("Root Layout Critical Error [digest: %s]:", error.digest || "none");
  }, [error]);

  const isProduction = process.env.NODE_ENV === "production";
  const hasSensitiveData = /mongodb|postgres|mysql|redis|jwt|bearer|password|secret|key/i.test(
    error.message || ""
  );

  const displayMessage =
    isProduction || hasSensitiveData
      ? "A critical error interrupted the atelier layout initialization. You may attempt to recover the session or return to the storefront."
      : error.message ||
        "A critical error occurred while initializing the atelier platform layout.";

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased flex items-center justify-center p-6 font-sans">
        <main
          role="alert"
          aria-live="assertive"
          aria-labelledby="global-error-heading"
          aria-describedby="global-error-desc"
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600 border border-red-200">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
              Critical Layout Exception
            </span>
            <h1
              id="global-error-heading"
              className="text-3xl font-extrabold tracking-tight text-zinc-900"
            >
              System Interrupted
            </h1>
            <p id="global-error-desc" className="text-sm text-zinc-600 leading-relaxed">
              {displayMessage}
            </p>
            {error.digest && (
              <p className="text-[11px] font-mono text-zinc-400 pt-1">Digest: {error.digest}</p>
            )}
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
              aria-label="Retry loading root session"
            >
              Retry Session
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-semibold hover:bg-zinc-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
            >
              Return Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
