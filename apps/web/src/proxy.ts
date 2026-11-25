import { NextRequest, NextResponse } from "next/server";
import { getSafeRedirectUrl as baseGetSafeRedirectUrl } from "@veyora/utils";

export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback = "/account"
): string {
  return baseGetSafeRedirectUrl(target, fallback);
}

/**
 * Protected routes requiring an active session hint.
 * If unauthenticated, visitors are redirected to /login with a safe return URL.
 */
const PROTECTED_ROUTE_PREFIXES = ["/account", "/profile", "/orders"];

/**
 * Next.js 16 Proxy Convention for Veyora Storefront
 * Provides lightweight navigation handling only.
 *
 * NOTE: Proxy NEVER establishes authentication or inspects in-memory access tokens.
 * Access tokens live strictly in client Zustand memory.
 * The HttpOnly refreshToken cookie serves strictly as a hint that a session might exist.
 *
 * Auth routes (/login, /register, etc.) are ALWAYS allowed to render at the proxy level.
 * Client-side auth providers and form components handle redirecting authenticated users
 * after resolving the session lifecycle.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  // 1. Bypass API routes, static assets, and Next.js internals
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // 2. Extract session hint (HttpOnly refreshToken cookie)
  const hasSessionHint = Boolean(request.cookies.get("refreshToken")?.value);

  // 3. Evaluate Protected Route Access
  // If the user has absolutely no session hint (no refreshToken cookie), redirect to login
  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedRoute && !hasSessionHint) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    const destination = pathname + search;
    loginUrl.searchParams.set("redirect", destination);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Auth routes (/login, /register, etc.) always render at the proxy level.
  // The client-side AuthProvider / LoginForm resolves the session and redirects if authenticated.
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
