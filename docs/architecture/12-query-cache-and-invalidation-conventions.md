# Veyora Query Cache, Mutation & Invalidation Conventions

**Document ID:** `DOC-ARCH-12-CACHE-CONVENTIONS`  
**Execution Date:** November 24, 2026  
**Scope:** `@veyora/web`, `@veyora/admin`  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, TanStack Query v5)  
**Status:** Canonical Monorepo Standard

---

## 1. Query Key Conventions & Structure

All query keys in the Veyora monorepo must follow a predictable, hierarchical tuple structure:

```
[Domain, Entity, Scope/Action?, Identifiers/Filters?]
```

### Examples:

- **Domain Root:** `["catalog"]` or `["admin-orders"]`
- **Entity Scope:** `["catalog", "products"]` or `["admin-orders", "list"]`
- **Parameterized Query:** `["catalog", "products", { categoryId: "ethnic-wear", limit: 12 }]`
- **Specific Record:** `["catalog", "product", "banarasi-silk-saree"]` or `["orders", "detail", "ord-1001"]`

### Rules for Query Keys:

1. **Use Factories:** Never hardcode raw string arrays in components. Always import from `query-keys.ts`.
2. **Stable Filters:** Only pass primitives or clean objects to key factories. Omit `undefined` and `null` properties to ensure key stability across renders.
3. **Prefix Matching for Invalidation:** In TanStack Query, invalidating `['orders']` matches `['orders', 'list']` and `['orders', 'detail', '101']`. Use `adminOrderKeys.all` or `orderKeys.all` to invalidate an entire domain.

---

## 2. Optimistic Update Standards & Guardrails

Optimistic updates update client UI before server confirmation. In Veyora, optimistic updates are strictly governed:

### 2.1. Permitted Optimistic Updates

- **Wishlist toggling:** Add/remove item from personal lookbook collection.
- **Cart line-item removal:** Removing an item from the bag before API confirmation.
- **Notification read state:** Toggling a notification badge from unread to read.

### 2.2. Strictly Forbidden Optimistic Updates

- **Checkout totals:** Tax, shipping fees, discounts, and final totals must come from the server.
- **Payment processing:** Payment verification status and Razorpay webhooks are authoritative.
- **Authoritative inventory stock:** Warehouse stock numbers cannot be predicted client-side.
- **Financial transactions:** Refunds, credits, and ledger updates must be confirmed by the API.

### 2.3. The 5-Step Optimistic Pattern

```typescript
const mutation = useMutation({
  mutationFn: (id: string) => api.toggle(id),
  onMutate: async (id: string) => {
    // 1. Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: entityKeys.current() });
    // 2. Snapshot current data
    const previous = queryClient.getQueryData<EntityDto>(entityKeys.current());
    // 3. Optimistically set new data
    queryClient.setQueryData<EntityDto>(entityKeys.current(), (old) => transform(old, id));
    return { previous };
  },
  onError: (err, id, context) => {
    // 4. Rollback to snapshot on failure
    if (context?.previous) {
      queryClient.setQueryData(entityKeys.current(), context.previous);
    }
  },
  onSettled: () => {
    // 5. Always invalidate and re-synchronize
    queryClient.invalidateQueries({ queryKey: entityKeys.current() });
  },
});
```

---

## 3. Query Cancellation via `AbortSignal`

When components unmount or search inputs change rapidly:

1. TanStack Query automatically creates an `AbortController` and passes `{ signal }` to `queryFn`.
2. Query functions must pass `signal` into `apiClient`:
   ```typescript
   queryFn: ({ signal }) => catalogApi.getProductsWithMeta(params, signal);
   ```
3. `apiClient` attaches `signal: controller.signal` to `fetch()`.
4. When cancelled, the underlying TCP connection closes, preventing stale data from overwriting newer queries.

---

## 4. Authentication Isolation & Logout Purge

To prevent sensitive user or administrative data from remaining in memory:

1. **Pre-Clear Cancellation:** On sign-out, `clearQueryClient()` invokes `browserQueryClient.cancelQueries()` before `.clear()`.
2. **Immediate Purge:** `browserQueryClient.clear()` purges all query caches.
3. **Session Interception:** If a 401 response occurs and token refresh fails, `apiClient` invokes `onSessionExpired()`, which triggers `clearAuth()` / `clearAdminAuth()`.
4. **WebSocket Teardown:** `SocketProvider` immediately disconnects upon observing `!isAuthenticated`.

---

## 5. Developer Checklist for New Query Hooks

Before introducing a new query or mutation hook:

1. [ ] **Key in Factory:** Is the query key defined in `query-keys.ts`?
2. [ ] **Signal Passed:** Does `queryFn` accept `{ signal }` and forward it?
3. [ ] **Intentional StaleTime:** Is `staleTime` appropriate for the domain (not left at 0)?
4. [ ] **No Mock Data:** Does it call real API endpoints with proper error propagation?
5. [ ] **Optimistic Safety:** If optimistic, does it have snapshot rollback?
6. [ ] **Targeted Invalidation:** Does the mutation invalidate only relevant query keys?
