# Architecture Document: Persistent Authentication & Refresh Token Rotation

**Project**: Veyora Atelier — Haute Couture Clothing E-commerce Platform  
**Scope**: `apps/web`, `apps/admin`, `apps/api`  
**Branch**: `fix/auth-session-persistence-web-admin`  
**Status**: Fixed and Verified  
**Date**: November 2026

---

## 1. Executive Summary & Root Cause Analysis

A critical cross-application authentication regression was reported where refreshing the browser after a successful login caused the user to lose their authenticated session, reverting the navigation bar to "Sign In" and locking operators out of the Admin console.

### Confirmed Root Causes

1. **Proxy Premature Navigation Redirection**:
   - Both `apps/web/src/proxy.ts` and `apps/admin/src/proxy.ts` evaluated `request.cookies.get("refreshToken")?.value` during Next.js edge/proxy request handling.
   - Because the refresh token cookie was scoped to `/api/v1/auth` (and on port 4000 or API subdomains), the browser never attaches this cookie to ordinary page navigations (`/`, `/profile`, `/orders`, or `/admin/*`).
   - Consequently, the proxy treated all reload requests as unauthenticated (`hasSessionHint: false`), issuing an immediate HTTP 307 redirect to `/login` before the client-side `AuthProvider` could mount and call `/api/v1/auth/refresh`.

2. **Navbar Premature "Sign In" Rendering**:
   - `NavbarActions.tsx` evaluated `isAuthenticated && user` directly without checking `status === "initializing"`.
   - On page reload, Zustand starts in `status: "initializing"` (`isAuthenticated: false`), causing the Navbar to immediately render the "Sign In" link while `restoreSession()` was still executing.

3. **Silent Session Invalidation on Network Blips**:
   - Both `AuthProvider` and `AdminAuthProvider` caught all exceptions in `restoreSession()` and invoked `setUnauthenticated()`.
   - Temporary network failures (status 0, connection refused, or backend restarting) were erroneously treated as explicit logouts, clearing stored state and preventing recovery.

4. **Multi-Tab Session Desynchronization**:
   - Refresh token rotation was isolated to individual browser memory spaces without cross-tab broadcast synchronization, risking race conditions when multiple tabs were refreshed simultaneously.

---

## 2. Authentication & Session Architecture

```mermaid
sequenceDiagram
    autonumber
    participant Browser as Browser Window (Tab)
    participant Proxy as Next.js Proxy (Web / Admin)
    participant Provider as AuthProvider (Zustand)
    participant Guard as ProtectedRoute
    participant API as Express API (:4000)
    participant DB as MongoDB (Session Store)

    Note over Browser,Proxy: 1. User Reloads Page (F5) on /profile or /admin
    Browser->>Proxy: GET /profile
    Note over Proxy: Proxy permits navigation (Never establishes auth)
    Proxy-->>Browser: 200 OK (Renders HTML Shell & Hydrates)

    Note over Provider,Guard: 2. AuthProvider & ProtectedRoute Mount
    Provider->>Provider: status = "initializing", isLoading = true
    Guard->>Browser: Render AuthLoadingScreen (No premature redirect!)
    Browser->>Browser: Navbar renders loading skeleton pulse (No "Sign In"!)

    Note over Provider,API: 3. Session Restoration & Rotation
    Provider->>API: POST /api/v1/auth/refresh (credentials: "include")
    Note over Browser,API: Browser automatically sends HttpOnly refreshToken cookie (Path=/api/v1/auth)
    API->>DB: Validate refreshTokenHash & Check Family Id
    API->>DB: Invalidate old session, issue rotated session (7-day policy)
    API-->>Browser: Set-Cookie: refreshToken=<NewToken>; Path=/api/v1/auth; HttpOnly; SameSite=Lax
    API-->>Provider: 200 OK { user, accessToken, expiresIn: 900 }

    Note over Provider,Guard: 4. In-Memory Session Established
    Provider->>Provider: setAuth(user, accessToken) -> status = "authenticated"
    Provider->>Guard: isAuthenticated = true
    Guard->>Browser: Render Protected Page Content
    Browser->>Browser: Navbar displays User Avatar Dropdown
```

---

## 3. Storage Architecture & Credential Boundary

Under strict security compliance, credentials remain isolated to their authoritative tiers:

| Credential             | Storage Tier                            | JavaScript Accessible     | Persistence Across Reload                |
| :--------------------- | :-------------------------------------- | :------------------------ | :--------------------------------------- |
| **Access Token**       | Zustand in-memory store                 | Yes (in memory only)      | No (restored on reload via refresh)      |
| **Refresh Token**      | `HttpOnly` Cookie (`Path=/api/v1/auth`) | **NO** (never read by JS) | Yes (browser cookie jar, 7-day max-age)  |
| **Refresh Token Hash** | MongoDB `Session` collection            | No (SHA-256 hash)         | Yes (persisted until rotated or expired) |
| **User Profile Data**  | Zustand in-memory store                 | Yes (sanitized AuthUser)  | No (hydrated from refresh response)      |

> [!IMPORTANT]
> Neither the access token nor the refresh token is ever stored in `localStorage`, `sessionStorage`, `IndexedDB`, or client-readable cookies.

---

## 4. Cookie Configuration & Scoping

The refresh token cookie is configured strictly in `apps/api/src/modules/auth/config/auth-cookie.config.ts`:

```typescript
export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000, // 7 days
  };
}
```

- **Path Scope (`/api/v1/auth`)**: Ensures the refresh token is sent _exclusively_ to `/api/v1/auth/refresh` and `/api/v1/auth/logout`. It is never leaked during requests to catalog, checkout, or page routes.
- **SameSite (`lax`)**: Balances CSRF protection with top-level cross-site navigation compatibility.
- **HttpOnly**: Completely protects against client-side XSS token theft.

---

## 5. Explicit Auth State Model

Both `useAuthStore` and `useAdminAuthStore` implement a 5-state lifecycle model:

```typescript
export type AuthStatus =
  "initializing" | "authenticated" | "unauthenticated" | "refreshing" | "error";
```

- **`initializing`**: Application is mounting or performing initial refresh. `ProtectedRoute` renders loading screens; `NavbarActions` renders an animated placeholder skeleton.
- **`authenticated`**: Valid access token in Zustand memory. User profile accessible; protected routes open.
- **`unauthenticated`**: Confirmed 401/403 or explicit logout. Protected routes redirect to `/login`; Navbar shows "Sign In".
- **`refreshing`**: In-flight token renewal triggered by an API client 401 interceptor.
- **`error`**: Network outage, timeout, or server 5xx. Renders a recoverable connection state with a "Retry Connection" button without clearing existing credentials or triggering infinite redirect loops.

---

## 6. Multi-Tab Concurrency & Synchronization

- **Cross-Tab Notifications**: Uses browser `BroadcastChannel` (`"veyora_web_auth"` and `"veyora_admin_auth"`).
- **Zero Token Leakage**: The channel transmits only event type strings (`"LOGOUT"` or `"SESSION_SYNC"`). Actual tokens are never broadcast.
- **15-Second Backend Grace Window**: When two tabs refresh simultaneously, the Express API allows rotated tokens within a 15-second grace window to safely retrieve valid credentials without triggering false token reuse alerts.
