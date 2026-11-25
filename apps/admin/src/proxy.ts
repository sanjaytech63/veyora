import { NextRequest, NextResponse } from "next/server";
import { getSafeRedirectUrl } from "@veyora/utils";

export { getSafeRedirectUrl };

/**
 * Next.js 16 Proxy Convention for Veyora Admin Console
 * Provides lightweight navigation routing only.
 *
 * NOTE: Proxy NEVER establishes authentication or inspects in-memory access tokens.
 * Access tokens live strictly in client Zustand memory.
 * The HttpOnly refreshToken cookie serves strictly as a session renewal hint.
 *
 * /login is ALWAYS allowed to render at the proxy level.
 * Client-side AdminAuthProvider and AdminLoginForm handle redirecting authenticated operators
 * once the session lifecycle has resolved.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  // 1. Bypass API routes, static assets, and Next.js internals
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === "/login";

  // 2. /login is always allowed to render at the proxy level
  if (isLoginPage) {
    return NextResponse.next();
  }

  // 3. Extract administrator session indicator cookie (HttpOnly refreshToken hint)
  const hasAdminSessionHint = Boolean(request.cookies.get("refreshToken")?.value);

  // 4. In Admin, all non-login pages require at least a session hint (refreshToken cookie)
  // If no cookie hint exists at all, redirect to /login
  if (!hasAdminSessionHint) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    const destination = pathname + search;
    loginUrl.searchParams.set("redirect", destination);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Allow request to proceed to Server Component / Client Component tier where
  // AdminAuthProvider and AdminProtectedRoute will verify the session with the Express API
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
