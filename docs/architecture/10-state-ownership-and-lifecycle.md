# Veyora Monorepo State Ownership, Lifecycles & Governance Standards

**Document ID:** `DOC-ARCH-10-STATE-GOVERNANCE`  
**Execution Date:** November 24, 2026  
**Scope:** `@veyora/web`, `@veyora/admin`, `@veyora/ui`  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, TanStack Query v5, Zustand v5)  
**Status:** Canonical Monorepo Standard

---

## 1. The Five Tiers of State Ownership

To prevent state duplication, race conditions, stale cache synchronization, and unnecessary component re-renders, state across all Veyora applications must strictly follow this five-tier ownership model:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Tier 1: SERVER-OWNED DATA (TanStack React Query v5)                    │
│ Products, Categories, Collections, Cart API, Orders, Wishlist, Admin   │
│ - Request-isolated on server; singleton on browser                     │
│ - Managed via Query Keys, StaleTime, and Query Invalidation            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Initial Props / Hydration
┌───────────────────────────────────▼────────────────────────────────────┐
│ Tier 2: GLOBAL CLIENT UI STATE (Zustand Stores)                        │
│ Drawers (CartDrawer), Modals (SearchDialog), Nav toggles, Density      │
│ - Genuinely shared UI state across distinct component hierarchies      │
│ - Read via narrow selectors to minimize re-renders                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Tier 3: AUTHENTICATION SESSION STATE (Zustand Stores)                  │
│ Access token in-memory, Auth status, Logged-in user identity           │
│ - Wired directly to ApiClient request/refresh interceptors             │
│ - Invalidation hook triggers QueryClient.cancelQueries() + .clear()    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Tier 4: URL ROUTE & SEARCH PARAMETER STATE (Next.js Navigation)        │
│ Search filters, Category facets, Sorting dropdown, Pagination page     │
│ - Bookmarkable, shareable, and browser-back compatible                 │
│ - Synchronized via useSearchParams() and router.push()                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Tier 5: LOCAL EPHEMERAL STATE (React useState / useReducer / Form)     │
│ Form field validation, swatch picker selection, tab toggles, accordions│
│ - Isolated to component leaves; unmounts with the component            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Anti-Patterns & State Duplication Rules

### 2.1. The "Server Entity in Zustand" Anti-Pattern

- **Rule:** Never copy an entity fetched from the backend API into a Zustand store unless it is being edited in a disconnected draft mode.
- **Why:** TanStack Query already manages caching, deduplication, background re-validation, garbage collection, and mutation rollback. Copying server data into Zustand creates two conflicting sources of truth that quickly diverge.
- **Monorepo Audit Finding:** `useCartStore` and `useWishlistStore` were previously written as local storage stores. The production storefront operates entirely on `useCart()` and `useWishlist()`, which consume the `/cart` and `/wishlist` endpoints via TanStack Query. The legacy stores are retained for offline capability and unit test backwards-compatibility.

### 2.2. The "Broad Selector" Anti-Pattern

- **Anti-Pattern:** Calling `const { user, status, token } = useAuthStore()` inside a component that only needs one action or boolean.
- **Rule:** Always use narrow selectors:
  ```tsx
  // Good: Component only re-renders when isAuthenticated changes
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Good: Actions are referentially stable and never trigger re-renders
  const setAuth = useAuthStore((s) => s.setAuth);
  ```

### 2.3. The "Unmemoized Context Value" Anti-Pattern

- **Rule:** Any React Context provider whose value is an object or array MUST memoize the value with `React.useMemo()`.
  ```tsx
  // Bad: Creates new object reference on every parent render
  <SocketContext.Provider value={{ socket, isConnected }}>

  // Good: Stable reference; consumers only re-render when socket or isConnected changes
  const contextValue = React.useMemo(() => ({ socket, isConnected }), [socket, isConnected]);
  <SocketContext.Provider value={contextValue}>
  ```

---

## 3. Authentication & Logout Lifecycle Standards

To prevent cross-patron or cross-operator data leakage:

```
[User Initiates Logout or Token Refresh Fails]
                    │
                    ▼
     1. authApi.logout() (POST /auth/logout)
        - Clears HTTP-only refresh token cookie on server
                    │
                    ▼
     2. clearQueryClient()
        - browserQueryClient.cancelQueries() (Cancels in-flight requests)
        - browserQueryClient.clear() (Purges all cached data from memory)
                    │
                    ▼
     3. clearAuth() / clearAdminAuth()
        - Resets user: null, accessToken: null, isAuthenticated: false
                    │
                    ▼
     4. SocketProvider observes (!isAuthenticated || !userId)
        - socket.disconnect()
        - setSocket(null), setIsConnected(false)
                    │
                    ▼
     5. Redirect to /login
```

---

## 4. Developer Conventions for Future Providers & Stores

1. **Ask if Zustand is necessary:** Can this state be derived, stored in the URL, or managed in local React state?
2. **Never duplicate TanStack Query cache:** If the data comes from an HTTP endpoint, use TanStack Query.
3. **Always cancel queries on logout:** Maintain the `cancelQueries()` + `clear()` pattern in `clearQueryClient()`.
4. **Always memoize context providers:** Wrap provider values in `useMemo`.
5. **Always use narrow Zustand selectors:** Subscribe only to the minimal slice of state required by the component.
