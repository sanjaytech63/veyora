# Veyora Admin App Provider & State Management Architecture

**Document ID:** `DOC-ARCH-10-ADMIN-STATE`  
**Execution Date:** November 24, 2026  
**Target Application:** `@veyora/admin` (Port 3001)  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, TanStack Query v5, Zustand, Webpack)  
**Status:** Completed, Verified & Production-Ready

---

## 1. Executive Summary

As part of **Task 10 — Veyora Provider & State Management Architecture Optimization**, the provider hierarchy, administrative state ownership, Zustand stores, QueryClient lifecycle, and WebSocket listeners in `@veyora/admin` were audited and optimized.

Key outcomes:

1. **Hardened Admin QueryClient:** Implemented non-retry policy for 4xx errors (specifically preventing retry loops on 401 Unauthorized or 403 Forbidden). Added query cancellation (`cancelQueries()`) before clearing cache on administrative logout.
2. **Centralized Query Key Factories:** Expanded `apps/admin/src/lib/api/query-keys.ts` with centralized key factories for orders (`adminOrderKeys`), inventory (`adminInventoryKeys`), shipments (`adminShipmentKeys`), payments (`adminPaymentKeys`), catalog (`adminCatalogKeys`), and customers (`adminCustomerKeys`).
3. **Narrow Selectors in Admin Providers & Header:** Refactored `AdminAuthProvider`, `AdminSocketProvider`, and `AdminHeader` to use narrow action/property selectors, eliminating unnecessary re-renders.
4. **Admin Socket Context Memoization:** Memoized the `AdminSocketContext` value to prevent cascading re-renders across components subscribing via `useAdminSocket()`.
5. **Idempotent Logout & RBAC Integrity:** Confirmed that multi-call logouts and session timeouts cleanly clear state without race conditions.

---

## 2. Admin Provider Hierarchy & Dependency Graph

```
apps/admin/src/app/layout.tsx [Server Component: Document Shell]
  └── AppProviders [Client Component: Scoped Context Composition]
        ├── ThemeProvider (next-themes: defaultTheme="dark", class attribute)
        └── QueryProvider (@tanstack/react-query: getQueryClient())
              └── AdminAuthProvider (Restores admin session via adminAuthApi.refreshToken())
                    └── AdminSocketProvider (Authenticated admin WebSocket connection)
                          └── TooltipProvider (@radix-ui: global delayDuration=200)
                                ├── {children} (AdminLayout -> Page content)
                                └── Toaster (Sonner notification viewport)
```

### Provider Responsibilities & Mounting Order

| Provider                  | Library                  | Scope       | Purpose                                                                              |
| ------------------------- | ------------------------ | ----------- | ------------------------------------------------------------------------------------ |
| **`ThemeProvider`**       | `next-themes`            | Global Root | Injects administrative dark theme styling onto `<html>` element.                     |
| **`QueryProvider`**       | `@tanstack/react-query`  | Global Root | Instantiates and provides request-isolated or browser-singleton QueryClient.         |
| **`AdminAuthProvider`**   | Zustand + `adminAuthApi` | Global Root | Verifies operator token and enforces admin/superadmin role requirements.             |
| **`AdminSocketProvider`** | `socket.io-client`       | Global Root | Listens for real-time order reservations, fulfillment transitions, and stock alerts. |
| **`TooltipProvider`**     | Radix UI                 | Leaf UI     | Accessible tooltip hover context across administrative data tables.                  |
| **`Toaster`**             | Sonner                   | Leaf UI     | System alert toast notification container.                                           |

---

## 3. TanStack Query Configuration & Cache Lifecycle

### 3.1. Browser Singleton & SSR Isolation

- In `apps/admin/src/lib/api/query-client.ts`:
  - `typeof window === 'undefined'`: Returns a new `QueryClient` instance per render to preserve server request isolation.
  - `typeof window !== 'undefined'`: Returns the persistent `browserQueryClient` singleton across client navigations.

### 3.2. Error Classification & Non-Retrying of 4xx

```typescript
retry: (failureCount, error) => {
  if (error instanceof ApiClientError) {
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return false; // Never retry 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable
    }
  }
  const status = (error as { statusCode?: number })?.statusCode;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 1;
};
```

### 3.3. In-Flight Request Cancellation on Logout

When an operator logs out from `UserMenu`, `clearQueryClient()` cancels all active queries before invoking `.clear()`:

```typescript
export function clearQueryClient(): void {
  if (browserQueryClient) {
    browserQueryClient.cancelQueries();
    browserQueryClient.clear();
  }
}
```

This guarantees that pending administrative API requests cannot resolve and repopulate sensitive company data into the browser cache after sign-out.

---

## 4. Admin Zustand Store Inventory

| Store Name              | Path                             | State Properties                                                              | Actions                                                                                                    | Persistence                     | Consumers                                                           | Classification        |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------- | --------------------- |
| **`useAdminAuthStore`** | `src/stores/admin-auth-store.ts` | `status`, `admin`, `accessToken`, `isAuthenticated`, `isLoading`              | `setAdminAuth`, `setAdmin`, `clearAdminAuth`, `setLoading`, `setStatus`, `setUnauthenticated`              | In-memory + secure HTTP cookies | `AdminAuthProvider`, `AdminProtectedRoute`, `UserMenu`, `apiClient` | Global Admin Session  |
| **`useAdminUIStore`**   | `src/stores/admin-ui-store.ts`   | `sidebarCollapsed`, `mobileSidebarOpen`, `commandPaletteOpen`, `tableDensity` | `toggleSidebar`, `setSidebarCollapsed`, `setMobileSidebarOpen`, `setCommandPaletteOpen`, `setTableDensity` | In-memory                       | `AdminSidebar`, `AdminMobileSidebar`, `AdminHeader`                 | Global Admin UI State |

---

## 5. Administrative Session & Socket Lifecycle

### 5.1. Session Restoration & Role Verification

```typescript
const response = await adminAuthApi.refreshToken();
if (
  response &&
  response.user &&
  response.accessToken &&
  (response.user.role === "admin" || response.user.role === "superadmin")
) {
  setAdminAuth(response.user, response.accessToken);
  return;
}
setUnauthenticated();
```

- Non-admin patrons (e.g. standard customers) attempting to authenticate via the admin app are immediately rejected and set to unauthenticated.

### 5.2. Admin WebSocket Real-Time Integration

- `AdminSocketProvider` establishes connection only when `isAuthenticated && adminId` are valid.
- Subscribes to real-time events:
  1. `ADMIN_ORDER_NEW`: Triggers order toast and invalidates `["admin-orders"]` and `["admin-unfulfilled-orders"]`.
  2. `ORDER_UPDATED`: Invalidates `["admin-orders"]` and `["admin-unfulfilled-orders"]`.
  3. `PAYMENT_UPDATED`: Invalidates `["admin-orders"]` and `["admin-payments"]`.
  4. `SHIPMENT_UPDATED`: Invalidates `["admin-shipments"]` and `["admin-orders"]`.
  5. `ADMIN_INVENTORY_UPDATED`: Invalidates `["admin-inventory"]`.
- Clean disconnection on unmount and logout via `newSocket.disconnect()`.
