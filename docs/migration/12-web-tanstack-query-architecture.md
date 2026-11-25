# Veyora Web Storefront TanStack Query Architecture & Client Data Fetching

**Document ID:** `DOC-ARCH-12-WEB-QUERY`  
**Execution Date:** November 24, 2026  
**Target Application:** `@veyora/web` (Port 3000)  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, TanStack Query v5, Webpack)  
**Status:** Completed, Verified & Production-Ready

---

## 1. Executive Summary

As part of **Task 12 — Veyora TanStack Query Client-Side Data Fetching Optimization**, `@veyora/web` was standardized to establish consistent, high-performance client-side query lifecycles, typed query key factories, request cancellation via `AbortSignal`, deterministic optimistic updates with rollback, and seamless integration with Server Component initial data.

Key outcomes:

1. **Request Cancellation via `AbortSignal`:** Wired TanStack Query's `{ signal }` parameter from query functions directly into `catalogApi` and the underlying `apiClient`, preventing race conditions and aborting stale in-flight requests during rapid faceted filter clicks or debounced search keystrokes.
2. **Optimistic Mutations with Snapshot & Rollback:** Enhanced [apps/web/src/lib/hooks/use-wishlist.ts](file:///c:/Users/Sanjay/Desktop/veyora/apps/web/src/lib/hooks/use-wishlist.ts) with full optimistic update support for adding/removing garments, providing instant feedback while reliably rolling back if the network fails.
3. **Initial Server Data Integration:** Confirmed and standardized Server Component initial data propagation in [ProductDetailsClient](file:///c:/Users/Sanjay/Desktop/veyora/apps/web/src/app/products/[slug]/product-details-client.tsx) and [CategoryClient](file:///c:/Users/Sanjay/Desktop/veyora/apps/web/src/app/category/[slug]/category-client.tsx), eliminating duplicate requests after initial page load.
4. **WebSocket Cache Synchronization:** Real-time Socket.IO notifications cleanly invalidate order and shipment query keys, keeping the patron's UI fresh without polling.

---

## 2. Web Typed Query Key Factories

All query keys in `@veyora/web` are centralized in [apps/web/src/lib/api/query-keys.ts](file:///c:/Users/Sanjay/Desktop/veyora/apps/web/src/lib/api/query-keys.ts):

| Factory                       | Structure                                | Invalidation Scope                                    |
| ----------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| **`catalogKeys.products`**    | `["catalog", "products", filters]`       | Product catalog lists, search results, filtered grids |
| **`catalogKeys.product`**     | `["catalog", "product", slugOrId]`       | Individual garment specification and inventory        |
| **`catalogKeys.featured`**    | `["catalog", "featured", limit]`         | Homepage curated showcases                            |
| **`catalogKeys.related`**     | `["catalog", "related", id, categoryId]` | Product recommendation carousels                      |
| **`catalogKeys.categories`**  | `["catalog", "categories"]`              | Navigation menus and department taxonomy              |
| **`catalogKeys.collections`** | `["catalog", "collections"]`             | Curated seasonal lookbooks                            |
| **`cartKeys.current`**        | `["cart", "current"]`                    | Active shopping bag, line items, and coupon state     |
| **`wishlistKeys.current`**    | `["wishlist", "current"]`                | Patron's personal atelier collection                  |
| **`orderKeys.list`**          | `["orders", "list"]`                     | Patron's purchase history                             |
| **`orderKeys.detail`**        | `["orders", "detail", id]`               | Specific order fulfillment receipt                    |
| **`notificationKeys.all`**    | `["notifications"]`                      | Notification center list and unread badge count       |

---

## 3. Query Hooks & Lifecycle Standards

### 3.1. Catalog Queries with Request Cancellation

In [apps/web/src/hooks/use-catalog.ts](file:///c:/Users/Sanjay/Desktop/veyora/apps/web/src/hooks/use-catalog.ts):

```typescript
export function useProducts(params?: Partial<ProductQueryInput>) {
  return useQuery<ProductsResponse>({
    queryKey: catalogKeys.products(params as Record<string, unknown>),
    queryFn: ({ signal }) => catalogApi.getProductsWithMeta(params, signal),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}
```

When a patron adjusts price filters or sort dropdowns before previous requests complete, TanStack Query aborts the prior request via `signal`, and `apiClient` triggers `controller.abort()`, freeing network capacity.

### 3.2. Optimistic Wishlist Updates

In [apps/web/src/lib/hooks/use-wishlist.ts](file:///c:/Users/Sanjay/Desktop/veyora/apps/web/src/lib/hooks/use-wishlist.ts):

```typescript
const addToWishlistMutation = useMutation({
  mutationFn: (productId: string) => wishlistApi.addToWishlist({ productId }),
  onMutate: async (productId: string) => {
    // 1. Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: wishlistKeys.current() });
    // 2. Snapshot current cache
    const previousWishlist = queryClient.getQueryData<WishlistDto>(wishlistKeys.current());
    // 3. Optimistically insert item
    if (previousWishlist) {
      queryClient.setQueryData<WishlistDto>(wishlistKeys.current(), {
        ...previousWishlist,
        items: [...previousWishlist.items, { id: productId, productId, ... }],
        itemCount: previousWishlist.items.length + 1,
      });
    }
    return { previousWishlist };
  },
  onError: (error, _vars, context) => {
    // 4. Rollback to snapshot on error
    if (context?.previousWishlist) {
      queryClient.setQueryData(wishlistKeys.current(), context.previousWishlist);
    }
  },
  onSettled: () => {
    // 5. Always re-sync with server state
    queryClient.invalidateQueries({ queryKey: wishlistKeys.current() });
  },
});
```

---

## 4. Initial Server Data & Client Integration

In Task 11, server-side data fetching was established for public routes. Client leaf components integrate with this initial data cleanly:

1. **`ProductDetailsClient`:** Receives `initialProduct` as a prop. Initializes component state directly from the prop without firing a duplicate `useQuery` call on mount.
2. **`CategoryClient`:** Receives `initialCategory` as a prop. Uses `initialCategory.id` to parameterize `useProducts({ categoryId })` for interactive sorting and availability toggling.
3. **`CuratedCollectionClient`:** Receives initial products from the Server Component parent on `/` and manages local department tab transitions without fetching.

---

## 5. Performance, Polling & StaleTime Matrix

| Domain                  | `staleTime` | `gcTime`   | Refetch Triggers                                            | Background Strategy      |
| ----------------------- | ----------- | ---------- | ----------------------------------------------------------- | ------------------------ |
| **Product Catalog**     | 3 minutes   | 10 minutes | Filter changes, search input                                | Reconnect only           |
| **Categories / Brands** | 10 minutes  | 30 minutes | Rare                                                        | Cache first              |
| **Shopping Cart**       | 30 seconds  | 5 minutes  | Mutations (add, remove, quantity)                           | Reconnect + window focus |
| **Customer Wishlist**   | 1 minute    | 10 minutes | Optimistic mutation + settled sync                          | Reconnect                |
| **Order History**       | 30 seconds  | 5 minutes  | Cancellation mutation, Socket.IO (`ORDER_UPDATED`)          | Reconnect                |
| **Notifications**       | 1 minute    | 5 minutes  | Socket.IO (`NOTIFICATION_NEW`, `NOTIFICATION_UNREAD_COUNT`) | Real-time push           |
