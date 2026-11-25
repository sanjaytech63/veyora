import { NextRequest, NextResponse } from "next/server";
import { getSafeRedirectUrl as baseGetSafeRedirectUrl } from "@veyora/utils";

export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback = "/account"
): string {
  return baseGetSafeRedirectUrl(target, fallback);
}

/**
 * Next.js 16 Proxy Convention for Veyora Storefront
 * Provides lightweight navigation handling only.
 *
 * NOTE: Proxy NEVER establishes authentication or inspects in-memory access tokens.
 * Access tokens live strictly in client Zustand memory.
 * Session validation and restoration are handled exclusively on the client tier by
 * AuthProvider and ProtectedRoute via the authoritative Express API.
 *
 * This ensures browser page reloads reliably restore the existing session without premature
 * proxy redirects.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 1. Bypass API routes, static assets, and Next.js internals
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // 2. Allow all page routes to proceed to the application tier.
  // ProtectedRoute in client components enforces session checks and graceful loading states.
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static chunks, css, media)
     * - _next/image (image optimization metadata)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Static asset file extensions (.svg, .png, .jpg, .webp, .avif, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js)).*)",
  ],
};
