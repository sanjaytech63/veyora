# Migration & Verification Log: Persistent Authentication & Refresh Token Rotation

**Project**: Veyora Atelier — Haute Couture Clothing E-commerce Platform  
**Scope**: `apps/web`, `apps/admin`, `apps/api`  
**Branch**: `fix/auth-session-persistence-web-admin`  
**Status**: Fixed and Verified  
**Date**: November 2026

---

## 1. Authentication Lifecycle Comparison: Before vs. After

### 1.1. Web Storefront Reload Flow

| Stage                   | Before Fix (Regressed)                                                                                                                                        | After Fix (Hardened)                                                                                                                |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------- |
| **User Action**         | User logs in and refreshes `/profile` (F5)                                                                                                                    | User logs in and refreshes `/profile` (F5)                                                                                          |
| **Next.js Proxy**       | Proxy checked `request.cookies.get("refreshToken")`. Cookie was absent (scoped to `/api/v1/auth`), so proxy issued an immediate **307 Redirect to `/login`**. | Proxy acts as a lightweight navigation helper (`NextResponse.next()`), passing request to the page tier without premature redirect. |
| **Navbar State**        | Evaluated `isAuthenticated && user` (false on initial render), immediately flashing **"Sign In"**.                                                            | Evaluates `status === "initializing"`, rendering an animated skeleton pulse (`h-8 w-8 rounded-full bg-muted/60 animate-pulse`).     |
| **ProtectedRoute**      | Redirected to `/login` if `!isAuthenticated` was observed before initialization resolved.                                                                     | Renders `AuthLoadingScreen` and does **not** redirect while `status === "initializing"`.                                            |
| **Session Restoration** | `authApi.refreshToken()` was never reached due to proxy redirect.                                                                                             | `authApi.refreshToken()` is dispatched with `credentials: "include"`, receiving fresh access token and user object.                 |
| **Final State**         | User was stuck on `/login` with Sign In shown.                                                                                                                | User stays on `/profile`; Navbar displays user avatar; protected data renders seamlessly.                                           |

---

### 1.2. Admin Console Reload Flow

| Stage                   | Before Fix (Regressed)                                                                                                 | After Fix (Hardened)                                                                                                                       |
| :---------------------- | :--------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **User Action**         | Operator logs in and refreshes `/` or `/orders` (F5)                                                                   | Operator logs in and refreshes `/` or `/orders` (F5)                                                                                       |
| **Next.js Proxy**       | Proxy checked `request.cookies.get("refreshToken")`. Cookie was missing, so proxy issued **307 Redirect to `/login`**. | Proxy allows request through to `AdminProtectedRoute` without premature redirect.                                                          |
| **AdminProtectedRoute** | Redirected operator to `/login` prematurely.                                                                           | Renders `AdminAuthLoadingScreen` while `isInitializing` (`status === "initializing"`).                                                     |
| **Session Restoration** | Interrupted or failed silently on network error with blank black screen.                                               | Dispatches `adminAuthApi.refreshToken()`, rotates token, verifies `admin` / `superadmin` role, and sets `status: "authenticated"`.         |
| **Network Outage**      | Threw unhandled network error, rendering a permanent black screen.                                                     | Catches network outage (status 0 / 5xx), sets `status: "error"`, and renders a structured connection error screen with "Retry Connection". |

---

## 2. Test Verification Evidence

Focused test suites were executed across the affected workspaces:

### 2.1. Express API Cookie & Auth Tests

```powershell
npm run test:api -- auth-cookie
```

- **Result**: `4 passed (4)` in `src/__tests__/auth-cookie.test.ts` (881ms).
- Verified `Path=/api/v1/auth`, `HttpOnly=true`, `SameSite=lax`, and exact path matching on `clearCookie`.

```powershell
npm run test:api -- auth.test
```

- **Result**: `23 passed (23)` in `src/__tests__/auth.test.ts` (3.41s).
- Verified token generation, password hashing, customer login, admin login, token rotation, family reuse detection, session revocation, and logout.

### 2.2. Web Storefront Persistence Tests

```powershell
npm run test:web -- session-persistence proxy
```

- **Result**: `16 passed (16)` across `proxy.test.ts` (7) and `session-persistence.test.tsx` (9) (3.75s).
- Verified:
  1. Access token in Zustand memory only; zero tokens in localStorage/sessionStorage.
  2. Refresh cookie never read by client JS.
  3. Reload starts in `initializing` with skeleton loading in Navbar.
  4. `AuthProvider` restores session on reload.
  5. Navbar displays user avatar after restoration.
  6. `ProtectedRoute` waits without premature redirect.
  7. 401 response sets unauthenticated and redirects.
  8. Network failure sets `error` status with retry action.
  9. Logout clears in-memory state and broadcasts across tabs.

### 2.3. Admin Console Persistence Tests

```powershell
npm run test:admin -- admin-session-persistence proxy
```

- **Result**: `13 passed (13)` across `proxy.test.ts` (6) and `admin-session-persistence.test.tsx` (7) (2.91s).
- Verified:
  1. Admin access token in Zustand memory only.
  2. `AdminProtectedRoute` renders loading screen while initializing.
  3. `AdminAuthProvider` restores admin session on reload.
  4. Customer role is rejected from admin restoration.
  5. Superadmin role authorization is preserved.
  6. Temporary network outage renders connection error UI with retry action.
  7. Logout clears admin credentials and query cache.

### 2.4. TypeScript Strict Verification

```powershell
npm run typecheck
```

- **Result**: **0 errors across all 8 workspaces** (Exit code 0).

---

## 3. Storage & Credential Verification Summary

| Credential                 | Storage Target                                | Security Control                                              | Verified     |
| :------------------------- | :-------------------------------------------- | :------------------------------------------------------------ | :----------- |
| **Access Token**           | Zustand Store Memory                          | Short-lived (15 min), never written to web storage            | **VERIFIED** |
| **Refresh Token**          | HttpOnly Cookie                               | `Path=/api/v1/auth`, `SameSite=lax`, `HttpOnly`, `Max-Age=7d` | **VERIFIED** |
| **Session Representation** | MongoDB `Session` Document                    | SHA-256 hash (`refreshTokenHash`), `familyId`                 | **VERIFIED** |
| **Web Storage Audit**      | `localStorage`, `sessionStorage`, `IndexedDB` | Zero authentication tokens stored                             | **VERIFIED** |
