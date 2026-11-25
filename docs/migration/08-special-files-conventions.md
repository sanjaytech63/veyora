# Veyora Next.js 16.4.6 Special Files Standards & Conventions

**Document ID:** `DOC-MIG-08-SPECIAL-FILES`  
**Execution Date:** November 24, 2026  
**Scope:** `@veyora/web` & `@veyora/admin`  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, App Router)  
**Status:** Completed & Fully Standardized

---

## 1. Executive Summary

This document establishes the official architectural standards and conventions for Next.js App Router special files across the Veyora monorepo. Task 08 standardized the usage of `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `robots.ts`, and `sitemap.ts` across both the public storefront (`apps/web`) and the administrative portal (`apps/admin`).

All special files adhere strictly to Next.js 16 rules, including asynchronous parameter handling, React 19 Client Component boundary isolation, streaming suspense fallbacks, and resilient error recovery mechanisms.

---

## 2. Special Files Matrix: Web vs. Admin

| File Convention                    | Component Model      | `@veyora/web` Responsibility                                                                                              | `@veyora/admin` Responsibility                                                                                            |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **`layout.tsx` (Root)**            | Server Component     | HTML document, Poppins font, global CSS, `WebSiteJsonLd`, `AppProviders`, `StoreLayout`                                   | HTML document, dark theme styling, global CSS, `AppProviders`, `AdminLayout`                                              |
| **`global-error.tsx`**             | Client Component     | Catches fatal root layout crashes. Renders standalone `<html>` & `<body>` with emergency recovery button                  | Catches fatal root layout crashes. Renders dark standalone `<html>` & `<body>` with emergency retry button                |
| **`error.tsx`**                    | Client Component     | Catches runtime storefront errors. Renders branded exception dialog with `reset()` and Return Home button                 | Catches runtime administrative errors. Renders branded console fault dialog with `reset()` and Return to Dashboard button |
| **`not-found.tsx`**                | Server / Client      | Renders 404 "Page Not Located" with navigation escape links to `/` and `/shop`                                            | Renders 404 "Administrative Resource Not Located" with escape link to executive dashboard                                 |
| **`loading.tsx` (Root)**           | Server Component     | Root streaming skeleton with pulsing atelier spinner                                                                      | Root streaming skeleton with dashboard header, KPI grid, and table skeleton                                               |
| **`loading.tsx` (Route-specific)** | Server Component     | 6 route-specific skeletons: `/shop`, `/products/[slug]`, `/category/[slug]`, `/collections/[slug]`, `/orders`, `/account` | 4 route-specific skeletons: `/products`, `/customers`, `/inventory`, `/orders`                                            |
| **`robots.ts`**                    | Server Route Handler | Serves `/robots.txt`: allows storefront routes; disallows `/checkout`, `/orders`, `/cart`, `/admin/*`                     | Serves `/robots.txt`: strictly disallows all crawlers on all routes (`disallow: ["/"]`)                                   |
| **`sitemap.ts`**                   | Server Route Handler | Serves `/sitemap.xml`: dynamically maps all public products, categories, collections, and static pages                    | Not implemented (Administrative console must not provide sitemaps)                                                        |

---

## 3. Loading Skeletons Topology

Route-specific streaming skeletons eliminate layout shift (CLS) and provide immediate perceived performance during server-side data fetching and client hydration.

### Web Storefront Skeletons

1. **`/shop/loading.tsx`:** Filter bar pill skeletons + 8-card garment catalog grid with aspect-ratio placeholders and pricing lines.
2. **`/products/[slug]/loading.tsx`:** 2-column editorial garment skeleton: left gallery media + thumbnail strip; right breadcrumbs, title, pricing, size selector pills, quantity controls, and buy button.
3. **`/category/[slug]/loading.tsx`:** Hero department banner skeleton + curated product grid.
4. **`/collections/[slug]/loading.tsx`:** Lookbook header skeleton + curated ensemble cards.
5. **`/orders/loading.tsx`:** Order card skeletons displaying order numbers, status badges, item thumbnails, and receipt links.
6. **`/account/loading.tsx`:** Customer avatar skeleton, dossier header, tab navigation, and personal details form.

### Admin Dashboard Skeletons

1. **`/products/loading.tsx`:** Catalog management skeleton: KPI summary cards, search filter bar, and product rows with thumbnails and SKU badges.
2. **`/customers/loading.tsx`:** Patron registry skeleton: patron cohort metrics, search bar, and customer table with avatar placeholders.
3. **`/inventory/loading.tsx`:** Stock matrix skeleton: warehouse balance cards, threshold alert indicators, and SKU ledger rows.
4. **`/orders/loading.tsx`:** Fulfillment ledger skeleton: order status tabs (Pending, Paid, Shipped, Delivered), customer detail columns, and status pills.

---

## 4. Error Boundaries & Recovery Architecture

### Client Component Boundaries (`error.tsx`)

In Next.js App Router, error boundaries must be Client Components (`"use client"`). They receive two props:

- `error: Error & { digest?: string }`
- `reset: () => void`

**Standard Implementation Pattern:**

1. **Error Logging:** Safe client logging without leaking internal passwords or tokens (`console.error("Caught Exception:", error)`).
2. **Diagnostic Digest:** Displays `error.digest` to allow operators or users to report exact issue codes to customer service.
3. **Recovery Action:** Invoking `reset()` re-attempts rendering the failed component tree without requiring a hard browser reload.
4. **Escape Hatch:** Secondary button allows immediate navigation back to a safe known route (`/` or `/shop`).

### Root Crash Fallback (`global-error.tsx`)

Because `error.tsx` cannot catch errors originating inside the root `layout.tsx`, `global-error.tsx` provides the final safety net:

- Self-contained `<html>` and `<body>` tags.
- Standalone inline CSS / Tailwind styling that does not depend on theme providers or external stylesheets.
- Standalone reset button.

### Error Rethrowing vs. 404 Separation

A critical convention established in Task 08 is **never converting ordinary API or network errors into 404 responses**:

```typescript
// Correct Pattern in Server Components:
let product;
try {
  product = await catalogApi.getProduct(slug);
} catch (err: unknown) {
  if (err instanceof ApiClientError && (err.statusCode === 404 || err.code === "NOT_FOUND")) {
    notFound();
  }
  // Rethrow all other errors (500s, network dropouts) to error.tsx!
  throw err;
}

if (!product) {
  notFound();
}
```

---

## 5. Not-Found (`not-found.tsx`) Conventions

1. **Invocation:** Triggered explicitly via Next.js `notFound()` or when a request targets an unregistered route segment.
2. **Branded Visuals:** Avoid generic browser 404s. Both applications render branded views with compass icons and direct navigation links back to active sections.
3. **SEO Status Code:** During production builds, Next.js properly assigns HTTP status code `404` to `not-found.tsx` outputs.

---

## 6. Metadata Ownership Conventions

1. **Root Layout:** Defines application identity, default titles, title templates (`%s | Veyora` and `%s | Veyora Administration`), open graph metadata, and canonical base URLs.
2. **Leaf Pages:** Child `page.tsx` components define only leaf-specific titles, descriptions, and dynamic OpenGraph images. They never override the root title template.
3. **Robots Directives:** Admin enforces `robots: { index: false, follow: false, nocache: true }` globally. Web allows public storefront indexing while disallowing checkout, account, and authentication URLs via `robots.ts`.

---

## 7. Verification Results Summary

| Test / Build Target        | Scope                         | Status     | Details                                                                   |
| -------------------------- | ----------------------------- | ---------- | ------------------------------------------------------------------------- |
| **Monorepo Typecheck**     | All packages & apps           | **PASSED** | Exit code 0, 0 errors                                                     |
| **Admin Vitest Suite**     | `apps/admin`                  | **PASSED** | 7/7 test files, 23/23 tests passed                                        |
| **Web Vitest Suite**       | `apps/web`                    | **PASSED** | 10/10 test files, 73/73 tests passed                                      |
| **Admin Production Build** | `apps/admin` (Next.js 16.4.6) | **PASSED** | 21 routes + `_not-found` + `robots.txt` compiled (Exit 0)                 |
| **Web Production Build**   | `apps/web` (Next.js 16.4.6)   | **PASSED** | 24 routes + `_not-found` + `robots.txt` + `sitemap.xml` compiled (Exit 0) |
