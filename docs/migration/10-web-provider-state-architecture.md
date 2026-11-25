# Veyora Web Storefront Provider & State Management Architecture

**Document ID:** `DOC-ARCH-10-WEB-STATE`  
**Execution Date:** November 24, 2026  
**Target Application:** `@veyora/web` (Port 3000)  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, TanStack Query v5, Zustand, Webpack)  
**Status:** Completed, Verified & Production-Ready

---

## 1. Executive Summary

As part of **Task 10 — Veyora Provider & State Management Architecture Optimization**, the provider composition, client state ownership, Zustand store definitions, TanStack Query lifecycle, and authentication/WebSocket lifecycles in `@veyora/web` were comprehensively audited and hardened.

Key outcomes:

1. **QueryClient Isolation & Invalidation:** Fixed query client configuration to avoid retrying on 4xx client errors (such as 401 Unauthorized or 422 Validation). In `clearQueryClient()`, active queries are cancelled with `cancelQueries()` prior to cache clearing, preventing in-flight network requests from repopulating a previous patron's cache after logout.
2. **Narrow Zustand Selectors in Global Providers:** Refactored `AuthProvider` and `SocketProvider` to consume narrow selectors (`(s) => s.setAuth`, `(s) => s.isAuthenticated`, `(s) => s.user?.id`), ensuring providers do not trigger cascading re-renders across the entire storefront when unrelated store properties change.
3. **Socket Context Memoization:** Memoized `SocketContext` value (`{ socket, isConnected }`) to eliminate redundant re-renders for all `useSocket()` subscribers.
4. **State Ownership Clarification:** Documented the distinction between the active server-state commerce hooks (`useCart`, `useWishlist` backed by TanStack Query and `/cart`, `/wishlist` endpoints) and the legacy offline stores (`useCartStore`, `useWishlistStore`).

---

## 2. Web Provider Hierarchy & Dependency Graph

```
apps/web/src/app/layout.tsx [Server Component: Document Shell]
  └── AppProviders [Client Component: Scoped Context Composition]
        ├── ThemeProvider (next-themes: class attribute, system default)
        └── QueryProvider (@tanstack/react-query: getQueryClient())
              └── AuthProvider (Restores patron session via authApi.refreshToken())
                    └── SocketProvider (Authenticated real-time WebSocket connection)
                          └── TooltipProvider (@radix-ui: global delayDuration=200)
                                ├── {children} (StoreLayout -> Page content)
                                └── Toaster (Sonner notification viewport)
```

### Provider Responsibilities & Mounting Order

| Provider              | Library                 | Scope       | Mounting Order Rationale                                                                          |
| --------------------- | ----------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| **`ThemeProvider`**   | `next-themes`           | Global Root | Must wrap everything to inject `class="dark"` into `<html>` without hydration flash.              |
| **`QueryProvider`**   | `@tanstack/react-query` | Global Root | Must sit above `AuthProvider` and `SocketProvider` so both can access `useQueryClient()`.         |
| **`AuthProvider`**    | Zustand + `authApi`     | Global Root | Must sit above `SocketProvider` so real-time socket connections can observe authentication state. |
| **`SocketProvider`**  | `socket.io-client`      | Global Root | Consumes `useAuthStore` and `useQueryClient` to invalidate queries on real-time events.           |
| **`TooltipProvider`** | Radix UI                | Leaf UI     | Accessible tooltip hover delay context.                                                           |
| **`Toaster`**         | Sonner                  | Leaf UI     | Global notification container.                                                                    |

---

## 3. TanStack Query Configuration & Cache Lifecycle

### 3.1. Request Isolation vs. Browser Singleton

In `apps/web/src/lib/api/query-client.ts`:

- **Server-Side Rendering (SSR):** When `typeof window === 'undefined'`, `getQueryClient()` instantiates a fresh `QueryClient` per request, preventing cross-request data pollution.
- **Browser Execution:** When `typeof window !== 'undefined'`, a module-level singleton `browserQueryClient` is reused across renders, preserving cache consistency during client-side navigation.

### 3.2. Smart Retry Policy

Default query retries have been refined to reject client-side errors:

```typescript
retry: (failureCount, error) => {
  // Never retry 4xx errors (e.g. 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable)
  if (error instanceof ApiClientError) {
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return false;
    }
  }
  const status = (error as { statusCode?: number })?.statusCode;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return false;
  }
  // At most 1 retry for transient 5xx or network transport drops
  return failureCount < 1;
};
```

### 3.3. Prevention of Post-Logout Cache Repopulation

When a patron signs out, calling `browserQueryClient.clear()` alone leaves in-flight HTTP requests active. If a pending request resolves after logout, TanStack Query would insert that sensitive data into the newly cleared cache.
**Hardened Implementation:**

```typescript
export function clearQueryClient(): void {
  if (browserQueryClient) {
    // 1. Cancel in-flight queries so responses are discarded
    browserQueryClient.cancelQueries();
    // 2. Purge all cached query data
    browserQueryClient.clear();
  }
}
```

---

## 4. Web Zustand Store Inventory & Ownership

| Store Name             | Path                           | State Properties                                                              | Actions                                                                                         | Persistence                              | Primary Consumers                                                                | State Classification             |
| ---------------------- | ------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------- |
| **`useAuthStore`**     | `src/stores/auth-store.ts`     | `status`, `user`, `accessToken`, `isAuthenticated`, `isLoading`               | `setAuth`, `setUser`, `clearAuth`, `setLoading`, `setStatus`, `setUnauthenticated`              | None (In-memory + secure HTTP cookies)   | `AuthProvider`, `NavbarActions`, `ProtectedRoute`, `apiClient` interceptors      | Global Client Auth Session       |
| **`useUIStore`**       | `src/stores/ui-store.ts`       | `mobileNavOpen`, `searchModalOpen`, `cartDrawerOpen`, `announcementDismissed` | `setMobileNavOpen`, `setSearchModalOpen`, `setCartDrawerOpen`, `dismissAnnouncement`, `resetUI` | None (Ephemeral memory)                  | `Navbar`, `NavbarMobile`, `MobileBottomNav`, `CartDrawer`, `ProductDetailClient` | Global Client UI State           |
| **`useCartStore`**     | `src/stores/cart-store.ts`     | `items`                                                                       | `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getItemCount`, `getSubtotal`           | `localStorage` (`veyora-cart-store`)     | Retained for unit test baseline                                                  | Offline Client Cart (Legacy)     |
| **`useWishlistStore`** | `src/stores/wishlist-store.ts` | `items`                                                                       | `toggleWishlist`, `isInWishlist`, `removeItem`, `clearWishlist`, `getItemCount`                 | `localStorage` (`veyora-wishlist-store`) | Retained for offline capability                                                  | Offline Client Wishlist (Legacy) |

### Active Commerce State Architecture: Server-State via TanStack Query

In the active storefront, commerce operations are managed through TanStack Query hooks that interact directly with the backend API:

- **`useCart()` (`src/lib/hooks/use-cart.ts`):** Backed by `cartKeys.current()` (`["cart", "current"]`). Fetches from `GET /api/v1/cart`, with mutations for `POST /cart/items`, `PATCH /cart/items/:id`, and `POST /cart/coupon`. All cart mutations update query data and trigger invalidation.
- **`useWishlist()` (`src/lib/hooks/use-wishlist.ts`):** Backed by `wishlistKeys.current()` (`["wishlist", "current"]`). Fetches from `GET /api/v1/wishlist`, with mutations for `POST /wishlist` and `DELETE /wishlist/:id`.

---

## 5. Authentication & WebSocket Lifecycles

### 5.1. Session Restoration Flow

1. On initial mount, `AuthProvider` checks `useAuthStore.getState().status`. If already `"authenticated"`, it skips restoration.
2. If unauthenticated, it calls `authApi.refreshToken()` (using `credentials: "include"`).
3. If valid, `setAuth(user, accessToken)` is invoked.
4. If invalid or 401, `setUnauthenticated()` is invoked, calling `clearQueryClient()`.

### 5.2. Real-Time Socket Connection Governance

1. `SocketProvider` monitors `isAuthenticated` and `userId` via narrow selectors.
2. When both are truthy, `io(socketUrl, { withCredentials: true, transports: ["websocket", "polling"] })` connects.
3. Listens for `NOTIFICATION_NEW`, `NOTIFICATION_UNREAD_COUNT`, `ORDER_UPDATED`, and `SHIPMENT_UPDATED`.
4. On logout or disconnect, `socket.disconnect()` is executed, and state resets to `null`.
5. On unmount, the effect cleanup disconnects the socket cleanly.
