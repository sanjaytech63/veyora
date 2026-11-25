# Veyora Web Storefront Server-Side Data Fetching Architecture

**Document ID:** `DOC-ARCH-11-WEB-SERVER-FETCHING`  
**Execution Date:** November 24, 2026  
**Target Application:** `@veyora/web` (Port 3000)  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, App Router, Webpack)  
**Status:** Completed, Verified & Production-Ready

---

## 1. Executive Summary

As part of **Task 11 — Veyora Server-Side Data Fetching Architecture**, `@veyora/web` was upgraded with a dedicated, server-only data-fetching layer designed specifically for Next.js App Router Server Components.

Prior to this task:

- Server Components imported browser-facing API modules (`catalogApi` from `apps/web/src/lib/api/catalog-api.ts`), which internally relied on the browser `apiClient` singleton.
- Server data access did not forward incoming request cookies, lacked configurable server-to-server internal URL resolution, and could not be isolated from browser client bundles.

Following the execution of Task 11:

- A dedicated server client, [apps/web/src/lib/api/server-api-client.ts](file:///c:/Users/Sanjay/Desktop/veyora/apps/web/src/lib/api/server-api-client.ts), provides a secure, server-only boundary with automatic `INTERNAL_API_URL` resolution, selective cookie forwarding via Next.js `cookies()`, and structured error normalization via `ServerApiClientError`.
- Public storefront pages—including the homepage (`/`), collections index (`/collections`), collection lookbook details (`/collections/[slug]`), category departments (`/category/[slug]`), and product details (`/products/[slug]`)—fetch initial data on the server via `serverCatalog`.
- Interactive client components retain TanStack Query for dynamic filters, cart drawers, customer checkout, and optimistic mutations.

---

## 2. Server Data Services Architecture

### 2.1. Server-Only Module Isolation

`server-api-client.ts` enforces a strict runtime barrier:

```typescript
if (typeof window !== "undefined") {
  throw new Error("server-api-client cannot be imported or executed in a Client Component.");
}
```

Any accidental bundling into client JavaScript throws an immediate exception during evaluation.

### 2.2. Base URL Priority Resolution

In containerized and cloud deployments, server-side calls can communicate over high-speed internal networks rather than routing back through public load balancers:

1. `process.env.INTERNAL_API_URL` (e.g. `http://api:4000/api/v1`)
2. `process.env.API_URL` (standard server API location)
3. `process.env.NEXT_PUBLIC_API_URL` (public client fallback)
4. `http://localhost:4000/api/v1` (local development default)

### 2.3. Cookie Forwarding for Authenticated Server Reads

When server reads require patron authentication (e.g. verifying an account or session):

```typescript
async function getForwardedCookieHeader(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const forwarded: string[] = [];
    const refreshToken = cookieStore.get("refreshToken")?.value;
    const guestId = cookieStore.get("guest_id")?.value;
    if (refreshToken) forwarded.push(`refreshToken=${refreshToken}`);
    if (guestId) forwarded.push(`guest_id=${guestId}`);
    return forwarded.join("; ");
  } catch {
    return "";
  }
}
```

Only essential cookies (`refreshToken`, `guest_id`) are forwarded. Browser headers are never forwarded indiscriminately.

---

## 3. Routes Migrated to Server Data Services

| Route                   | File Path                             | Server Service Method                                                                  | Data Fetched                                                         | Error Handling                                  |
| ----------------------- | ------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| **Homepage**            | `src/app/page.tsx`                    | `serverCatalog.getCategories()`, `getFeaturedProducts(4)`, `getProducts({ limit: 8 })` | Hero garment, department taxonomy, new arrivals, editorial lookbooks | `Promise.allSettled` with fallback defaults     |
| **Collections Index**   | `src/app/collections/page.tsx`        | `serverCatalog.getCollections()`                                                       | Active lookbooks, seasonal edits, cover photography                  | Graceful empty lookbook state                   |
| **Collection Details**  | `src/app/collections/[slug]/page.tsx` | `serverCatalog.getCollectionBySlug(slug)`                                              | Lookbook hero, curation tagline, garment list                        | `notFound()` on missing slug                    |
| **Category Department** | `src/app/category/[slug]/page.tsx`    | `serverCatalog.getCategoryBySlug(slug)`                                                | Category metadata, description, banner image                         | `notFound()` on missing category                |
| **Product Details**     | `src/app/products/[slug]/page.tsx`    | `serverCatalog.getProductBySlug(slug)`                                                 | Complete garment specification, variants, pricing                    | `notFound()` on 404; rethrow 5xx to `error.tsx` |

---

## 4. Routes Intentionally Retained on Client-Side

| Route                        | Reason for Retaining Client-Side Fetching                                                                                    | Active State Manager                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **`/shop`**                  | Highly dynamic catalog driven by multi-facet client filters (price sliders, color swatches, size chips, sorting, pagination) | TanStack Query (`useProducts`) + URL `searchParams`  |
| **`/search`**                | Real-time debounced typeahead suggestions, query highlights, and keyboard navigation (`Cmd+K`)                               | TanStack Query (`useSearchProducts`)                 |
| **`/cart` & `/checkout`**    | Stateful customer purchasing funnel, coupon mutations, Razorpay payment verification, stock locking                          | TanStack Query (`useCart`) + Zustand (`cart-store`)  |
| **`/wishlist`**              | Customer-specific collection toggle mutations, optimistic UI updates                                                         | TanStack Query (`useWishlist`)                       |
| **`/account/profile`**       | Authenticated patron dossier editing, address book CRUD dialogs                                                              | TanStack Query (`useProfile`) + React Hook Form      |
| **`/account/notifications`** | Real-time notification center driven by WebSocket (`socket.io-client`) invalidations                                         | TanStack Query (`useNotifications`) + SocketProvider |

---

## 5. Error Handling Conventions

1. **`ServerApiClientError`:** All upstream HTTP errors, timeouts, and network failures are normalized into a strongly-typed `ServerApiClientError` containing `statusCode`, `code`, and `details`.
2. **Selective `notFound()` Invocation:**
   ```typescript
   try {
     product = await serverCatalog.getProductBySlug(slug);
   } catch (err: unknown) {
     if (err instanceof ServerApiClientError && err.isNotFound()) {
       notFound(); // Triggers not-found.tsx only for genuine 404s
     }
     throw err; // Re-throws 500s so error.tsx displays the recovery boundary
   }
   ```
3. **Protection Against Information Disclosure:** Server-side errors logged to stdout include request endpoints and status codes, but strip authorization tokens, cookies, and database connection strings.

---

## 6. Caching Boundaries & Items Deferred to Task 13

In strict compliance with task scope restrictions:

- No `use cache`, `cacheLife`, or `cacheTag` directives were introduced in this task.
- Server fetches currently use Next.js default fetch semantics without tag-based invalidations.
- Revalidation schedules, stale-while-revalidate configurations, and Cache Components are explicitly deferred to **Task 13**.
