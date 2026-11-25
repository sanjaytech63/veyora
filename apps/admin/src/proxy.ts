import { NextRequest, NextResponse } from "next/server";
import { getSafeRedirectUrl } from "@veyora/utils";

export { getSafeRedirectUrl };

/**
 * Next.js 16 Proxy Convention for Veyora Admin Console
 * Provides lightweight navigation routing only.
 *
 * NOTE: Proxy NEVER establishes authentication or inspects in-memory access tokens.
 * Access tokens live strictly in client Zustand memory.
 *
 * Session validation and administrator role verification are handled exclusively by
 * AdminAuthProvider and AdminProtectedRoute via the authoritative Express API.
 * This guarantees that browser page reloads reliably restore active admin sessions without
 * premature proxy redirects.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 1. Bypass API routes, static assets, and Next.js internals
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // 2. Allow all page routes to proceed to the application tier.
  // AdminProtectedRoute handles verifying operator permissions and rendering loading screens.
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static chunks, css)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt
     * - Static asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js)).*)",
  ],
};
