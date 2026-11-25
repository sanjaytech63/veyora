# Task 06 — Veyora Web Storefront App Router Architecture Standardization

## 1. Executive Summary

This report documents the architectural audit and standardization of the Next.js App Router implementation in `apps/web/src/app` for the Veyora web storefront under Next.js 16.4.6.

All existing public storefront routes, customer account routes, checkout flows, and SEO metadata endpoints were systematically audited and standardized. All public URLs, business logic, customer authentication flows, and backend API contracts were strictly preserved without redesign or regression.

---

## 2. Complete Route Inventory

Every route under `apps/web/src/app` is documented below:

| Route Path                                | Type           | Segment   | Component Type                                | Error/Loading/NotFound                    | Data Fetching Responsibility                            | Auth Requirement                          | Metadata / SEO                                                                    | Notes & Relationships                                 |
| :---------------------------------------- | :------------- | :-------- | :-------------------------------------------- | :---------------------------------------- | :------------------------------------------------------ | :---------------------------------------- | :-------------------------------------------------------------------------------- | :---------------------------------------------------- |
| `/`                                       | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `useCategories`, `useFeaturedProducts`, `useProducts`   | Public                                    | Inherits root layout metadata + `WebSiteJsonLd`                                   | Fashion editorial homepage                            |
| `/shop`                                   | Page           | Static ○  | Client (in Suspense)                          | `layout`, `error`, `loading`, `not-found` | `useCategories`, `useBrands`, `useProducts`             | Public                                    | Static title & description                                                        | Storefront catalog with URL query sync                |
| `/products`                               | Page / Alias   | Static ○  | Server (renders Shop)                         | `layout`, `error`, `loading`, `not-found` | Delegates to `<ShopPage />`                             | Public                                    | Static title & description                                                        | Alias to `/shop` catalog                              |
| `/products/[slug]`                        | Page           | Dynamic ƒ | Server + Client (`ProductDetailsClient`)      | `layout`, `error`, `loading`, `not-found` | `catalogApi.getProduct(slug)`                           | Public                                    | Dynamic `generateMetadata`, OpenGraph, `ProductJsonLd`, `BreadcrumbJsonLd`        | Product details, variant picker, reviews              |
| `/category/[slug]`                        | Page           | Dynamic ƒ | Server + Client (`CategoryClient`)            | `layout`, `error`, `loading`, `not-found` | `catalogApi.getCategoryBySlug(slug)`, `useProducts`     | Public                                    | Dynamic `generateMetadata`, OpenGraph, `CollectionPageJsonLd`, `BreadcrumbJsonLd` | Primary category department route                     |
| `/categories/[slug]`                      | Page / Alias   | Dynamic ƒ | Server (re-exports `/category/[slug]`)        | `layout`, `error`, `loading`, `not-found` | Delegates to `/category/[slug]/page`                    | Public                                    | Dynamic `generateMetadata` (re-exported)                                          | Plural alias re-exporting `/category/[slug]`          |
| `/collections`                            | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `useCollections`                                        | Public                                    | Inherits root metadata                                                            | Curated lookbooks & seasonal edits                    |
| `/collections/[slug]`                     | Page           | Dynamic ƒ | Server + Client (`CollectionClient`)          | `layout`, `error`, `loading`, `not-found` | `catalogApi.getCollectionBySlug(slug)`, `useCollection` | Public                                    | Dynamic `generateMetadata`, OpenGraph, canonical                                  | Single lookbook & collection garments                 |
| `/new-arrivals`                           | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `useCategories`, `useProducts`                          | Public                                    | Inherits root metadata                                                            | Latest seasonal drops                                 |
| `/search`                                 | Page           | Dynamic ƒ | Server + Client (`SearchClient` in Suspense)  | `layout`, `error`, `loading`, `not-found` | `useSearchCatalog`, `useSearchSuggestions`              | Public                                    | Dynamic `generateMetadata` with query canonical                                   | Faceted search with suggestions & filters             |
| `/cart`                                   | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `useCart` (Zustand + React Query)                       | Public (Guest & Auth)                     | Disallowed in `robots.ts`                                                         | Guest & customer shopping bag                         |
| `/checkout`                               | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `useCheckout`, `useAddresses`, `usePayment`             | Public (Guest & Auth)                     | Disallowed in `robots.ts`                                                         | Multi-step checkout & Razorpay payment                |
| `/wishlist`                               | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `useWishlist`, `useCart`                                | Public (Local & Auth)                     | Inherits root metadata                                                            | Saved garments & move to bag                          |
| `/profile`                                | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `useProfile`                                            | Authenticated Customer (`ProtectedRoute`) | `robots.ts` disallowed                                                            | Patron profile & shipping addresses                   |
| `/account/profile`                        | Page / Alias   | Static ○  | Server (re-exports `/profile`)                | `layout`, `error`, `loading`, `not-found` | Delegates to `/profile/page`                            | Authenticated Customer (`ProtectedRoute`) | Disallowed in `robots.ts`                                                         | Alias re-exporting `/profile`                         |
| `/orders`                                 | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `useOrders`                                             | Authenticated Customer (`ProtectedRoute`) | Disallowed in `robots.ts`                                                         | Order history & status filters                        |
| `/orders/[id]`                            | Page           | Dynamic ƒ | Server + Client (`CustomerOrderDetailClient`) | `layout`, `error`, `loading`, `not-found` | `useOrderDetail(orderId)`                               | Authenticated Customer (`ProtectedRoute`) | `robots: { index: false, follow: false }`                                         | Order telemetry, milestones & tracking                |
| `/tracking`                               | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `useQuery` (`shippingApi.trackShipment`)                | Public                                    | Included in `sitemap.ts`                                                          | Public airway bill parcel tracking                    |
| `/notifications`                          | Redirect       | Static ○  | Server Redirect                               | N/A                                       | None                                                    | Authenticated Customer                    | N/A                                                                               | Permanent server redirect to `/account/notifications` |
| `/account/notifications`                  | Page           | Static ○  | Server + Client (`NotificationsCenterClient`) | `layout`, `error`, `loading`, `not-found` | `useNotifications`, `useNotificationCount`              | Authenticated Customer (`ProtectedRoute`) | Static title & description                                                        | Notification center & preference controls             |
| `/account/notifications/[notificationId]` | Page           | Dynamic ƒ | Server + Client (`NotificationDetailClient`)  | `layout`, `error`, `loading`, `not-found` | `useNotificationDetail`                                 | Authenticated Customer (`ProtectedRoute`) | Static metadata, noindex                                                          | Individual notification dispatch details              |
| `/login`                                  | Page           | Static ○  | Client (`LoginForm` in Suspense)              | `layout`, `error`, `loading`, `not-found` | `authApi.login`                                         | Guest / Auth Redirect                     | Disallowed in `robots.ts`                                                         | Email & password authentication                       |
| `/register`                               | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `authApi.register`                                      | Guest / Auth Redirect                     | Disallowed in `robots.ts`                                                         | Patron registration                                   |
| `/verify-otp`                             | Page           | Static ○  | Client (`VerifyOtpForm` in Suspense)          | `layout`, `error`, `loading`, `not-found` | `authApi.verifyEmail`, `authApi.resendOtp`              | Guest / Auth Flow                         | Disallowed in `robots.ts`                                                         | 6-digit email OTP verification                        |
| `/forgot-password`                        | Page           | Static ○  | Client Component                              | `layout`, `error`, `loading`, `not-found` | `authApi.forgotPassword`                                | Guest / Auth Flow                         | Disallowed in `robots.ts`                                                         | Password reset dispatch                               |
| `/reset-password`                         | Page           | Static ○  | Client (`ResetPasswordForm` in Suspense)      | `layout`, `error`, `loading`, `not-found` | `authApi.resetPassword`                                 | Guest / Auth Flow                         | Disallowed in `robots.ts`                                                         | Password reset completion                             |
| `/robots.txt`                             | Metadata Route | Static ○  | Server (`robots.ts`)                          | N/A                                       | Static rule generation                                  | Public                                    | SEO Crawler Directives                                                            | Crawl instructions & sitemap location                 |
| `/sitemap.xml`                            | Metadata Route | Static ○  | Server (`sitemap.ts`)                         | N/A                                       | `catalogApi.getProducts`, `catalogApi.getCategories`    | Public                                    | Dynamic Sitemap                                                                   | XML sitemap with static & dynamic URLs                |
| `/_not-found`                             | Root Not Found | Static ○  | Server (`not-found.tsx`)                      | `layout`                                  | None                                                    | Public                                    | Branded 404 UI                                                                    | Storefront 404 page                                   |

---

## 3. Existing Routing Problems Identified

During the audit, five primary architectural inconsistencies and deficiencies were identified:

1. **Absence of Root Error Boundaries (`error.tsx` & `global-error.tsx`)**:
   - `apps/web/src/app` lacked both `error.tsx` and `global-error.tsx`. Uncaught exceptions inside route components resulted in unstyled Next.js error screens rather than a cohesive branded fallback with retry functionality.
2. **Absence of Root Loading State (`loading.tsx`)**:
   - There was no top-level App Router loading boundary, preventing instant visual feedback and streaming suspense during route transitions within `StoreLayout`.
3. **Inconsistent Dynamic Routing Patterns**:
   - `/products/[slug]`, `/category/[slug]`, and `/account/notifications/[notificationId]` were structured as clean Next.js 16 Server Components using async `params` and passing data or identifiers to client components.
   - Conversely, `/collections/[slug]` was an unstandardized Client Component directly calling `useParams()` without dynamic metadata, canonical links, or `generateMetadata`.
   - Similarly, `/orders/[id]` was a monolithic client component using `useParams()` without explicit route parameter validation or route guards.
4. **Lack of URL Query State Synchronization in `/shop`**:
   - In `/shop`, search terms, category filters, brand filters, sort order, and pagination were held entirely in component `useState`. Navigating to `/shop?category=kurtis` was ignored, and page refreshes wiped all active filters.
5. **Inconsistent Protected Route Guards**:
   - While `/profile`, `/account/notifications`, and `/account/notifications/[notificationId]` were wrapped in `<ProtectedRoute>`, `/orders` and `/orders/[id]` were unprotected on the client, leading to unauthenticated 401 API failures.

---

## 4. Changes Implemented

### A. Root App Router Convention Files

1. **Created `apps/web/src/app/error.tsx`**:
   - Client Component error boundary catching sub-tree runtime errors.
   - Provides branded atelier error styling with retry (`reset()`) and return home button.
2. **Created `apps/web/src/app/global-error.tsx`**:
   - Root layout crash handler with mandatory `<html>` and `<body>` tags.
3. **Created `apps/web/src/app/loading.tsx`**:
   - Lightweight loading skeleton inside `Container` with an atelier pulse animation.

### B. Standardized Dynamic Route Architecture

1. **Refactored `/collections/[slug]`**:
   - Created `apps/web/src/app/collections/[slug]/collection-client.tsx` containing the interactive lookbook and product grid.
   - Refactored `apps/web/src/app/collections/[slug]/page.tsx` into a Server Component awaiting `params: Promise<{ slug: string }>` in both `generateMetadata` and `SingleCollectionPage`.
   - Calls `notFound()` when the collection does not exist.
2. **Refactored `/orders/[id]`**:
   - Created `apps/web/src/app/orders/[id]/order-detail-client.tsx` wrapped in `<ProtectedRoute>`.
   - Refactored `apps/web/src/app/orders/[id]/page.tsx` into a Server Component awaiting `params: Promise<{ id: string }>` and setting `robots: { index: false, follow: false }`.
3. **Protected Customer Orders (`/orders`)**:
   - Wrapped `CustomerOrdersPage` in `apps/web/src/app/orders/page.tsx` with `<ProtectedRoute>` to handle unauthenticated sessions.

### C. Search & Catalog Query Synchronization (`/shop`)

1. **Refactored `apps/web/src/app/shop/page.tsx`**:
   - Initialized `search`, `selectedCategory`, `selectedBrand`, `inStockOnly`, `sortBy`, and `page` from `useSearchParams()`.
   - Added `updateUrl` to synchronize active filters to URL search parameters (`router.push` with query string).
   - Preserves filters across browser back/forward and page refresh.
   - Wrapped `ShopContent` in `<React.Suspense>` for Next.js static prerendering compliance.

---

## 5. Files Created, Modified or Moved

### Created Files

| File Path                                                   | Description                                         |
| :---------------------------------------------------------- | :-------------------------------------------------- |
| `apps/web/src/app/error.tsx`                                | Root App Router client error boundary               |
| `apps/web/src/app/global-error.tsx`                         | Root layout critical error boundary                 |
| `apps/web/src/app/loading.tsx`                              | Root streaming loading fallback                     |
| `apps/web/src/app/collections/[slug]/collection-client.tsx` | Client UI component for single collection lookbooks |
| `apps/web/src/app/orders/[id]/order-detail-client.tsx`      | Client UI component for customer order details      |
| `docs/migration/06-web-app-router-standardization.md`       | Task 06 standardization report                      |

### Modified Files

| File Path                                      | Description                                                          |
| :--------------------------------------------- | :------------------------------------------------------------------- |
| `apps/web/src/app/collections/[slug]/page.tsx` | Migrated to Next.js 16 Server Component with `generateMetadata`      |
| `apps/web/src/app/orders/[id]/page.tsx`        | Migrated to Next.js 16 Server Component with async `params`          |
| `apps/web/src/app/orders/page.tsx`             | Added `<ProtectedRoute>` guard                                       |
| `apps/web/src/app/shop/page.tsx`               | Added bidirectional URL query synchronization and `<React.Suspense>` |

---

## 6. Dynamic Routing Conventions Established

For all dynamic App Router routes in `apps/web`, the following unified conventions are enforced:

1. **Async Route Parameters**:
   ```typescript
   interface PageProps {
     params: Promise<{ slug: string }>;
     searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
   }
   ```
2. **Explicit Parameter Awaiting**:
   Dynamic route parameters must be awaited in both `generateMetadata` and page components:
   ```typescript
   export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
     const { slug } = await params;
     // ...
   }

   export default async function Page({ params }: PageProps) {
     const { slug } = await params;
     // ...
   }
   ```
3. **Invalid Resource Handling**:
   Routes validate parameters and call `notFound()` from `next/navigation` when resources are missing or invalid:
   ```typescript
   if (!resource) {
     notFound();
   }
   ```
4. **Server Component Shell + Client Component Interactivity**:
   Page entrypoints remain Server Components responsible for metadata, async parameters, and resource existence validation, delegating interactive state to dedicated client components (`*Client`).

---

## 7. Authentication Route Classification

| Category               | Routes Included                                                                                                                                                         | Protection Mechanism                                | Description                                                                                                                                                          |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public Storefront**  | `/`, `/shop`, `/products`, `/products/[slug]`, `/category/[slug]`, `/categories/[slug]`, `/collections`, `/collections/[slug]`, `/new-arrivals`, `/search`, `/tracking` | Open access                                         | Public browsing and catalog discovery. API routes enforce read permissions independently.                                                                            |
| **Hybrid Commerce**    | `/cart`, `/checkout`, `/wishlist`                                                                                                                                       | Guest persistence + optional authentication         | Can be used as guest; merges with patron account upon authentication.                                                                                                |
| **Customer Protected** | `/profile`, `/account/profile`, `/orders`, `/orders/[id]`, `/account/notifications`, `/account/notifications/[notificationId]`                                          | Client `<ProtectedRoute>` + API Bearer verification | Requires authenticated patron session. Unauthenticated users are redirected to `/login?redirect=<path>`. Express API enforces token validity and resource ownership. |
| **Auth Flow**          | `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password`                                                                                             | Session-aware redirect                              | Dedicated authentication onboarding. Redirects already authenticated patrons to intended destination.                                                                |

---

## 8. SEO & Metadata Observations

1. **Canonical URLs & OpenGraph**:
   - Public pages (`/`, `/shop`, `/products/[slug]`, `/category/[slug]`, `/collections/[slug]`, `/search`) configure explicit canonical links and OpenGraph tags.
2. **Private Page Protection (`robots.txt`)**:
   - `apps/web/src/app/robots.ts` disallows indexing on private and transactional routes (`/checkout`, `/cart`, `/orders`, `/orders/*`, `/login`, `/register`, `/verify-otp`, etc.).
   - Protected order detail pages specify `robots: { index: false, follow: false }` at the metadata level.
3. **XML Sitemap Integration**:
   - `apps/web/src/app/sitemap.ts` dynamically indexes verified public products and categories while providing static fallbacks.

---

## 9. Regression Test Results

### 1. Web Test Suite Execution

- **Command:** `npm run test --workspace=@veyora/web`
- **Result:**
  - Test files: **9 passed (9)**
  - Tests: **65 passed (65)**
  - Exit code: `0`

### 2. Monorepo-Wide Typecheck

- **Command:** `npm run typecheck`
- **Result:**
  - Projects checked: `@veyora/config`, `@veyora/types`, `@veyora/validators`, `@veyora/utils`, `@veyora/api`, `@veyora/worker`, `@veyora/web`, `@veyora/admin`
  - Errors: **0**
  - Exit code: `0`

### 3. Production Build Validation

- **Command:** `npm run build --workspace=@veyora/web`
- **Compiler:** Next.js 16.4.6 (Turbopack)
- **Result:**
  - TypeScript compilation: Clean (0 errors)
  - Static page generation: **24 static pages prerendered**
  - Dynamic routes: **6 dynamic route segments resolved**
  - Compilation duration: 2.2s
  - Exit code: `0`

---

## 10. Outstanding Issues & Recommendations

1. **Future Server Component Enhancements (Task 07+)**:
   - With the App Router architecture standardized, individual pages (such as `/collections` and `/new-arrivals`) can be progressively enhanced to stream catalog data via React Server Components.
2. **Proxy / Middleware Considerations (Task 08+)**:
   - Client-side `<ProtectedRoute>` handles UX redirects cleanly. When Next.js 16 edge middleware or proxy routing is introduced in subsequent tasks, route authentication guards can be evaluated at the edge layer.
3. **Zero Breaking Changes**:
   - All existing public URLs, storefront layouts, component styles, and business workflows remain 100% operational.
