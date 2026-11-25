# Veyora Architecture Audit Report — Web, Admin, API & Worker Monorepo

**Auditor:** Senior Next.js Architect & Full-Stack Systems Engineer  
**Date:** November 24, 2026  
**Scope:** `@veyora/web`, `@veyora/admin`, `@veyora/api`, `@veyora/worker`, and shared packages (`@veyora/types`, `@veyora/config`, `@veyora/validators`, `@veyora/utils`)  
**Status:** Audit Complete — No code modified, no files deleted, no dependencies upgraded.

---

## Executive Summary

Veyora is architected as an npm/Turborepo monorepo comprising two **Next.js 15.2.1** App Router frontends (`apps/web` storefront and `apps/admin` management portal), an **Express 4.21** REST + Socket.IO API backend (`apps/api`), a **BullMQ** worker (`apps/worker`), and four internal TypeScript packages.

While the monorepo exhibits modern foundational choices—such as React 19, Tailwind CSS v4, TypeScript 5.8, and TanStack Query v5—the frontend architecture suffers from **heavy over-reliance on client-side rendering (`"use client"`)**, **complete absence of Next.js route streaming and error boundaries (`loading.tsx`, `error.tsx`, `global-error.tsx`)**, **lack of edge/server middleware (`middleware.ts`)**, **mass component and API client duplication between Web and Admin**, and **critical dependency version drift between backend services**.

---

## 1. Current Architecture & Monorepo Topology

```
veyora (monorepo root)
├── apps/
│   ├── web/           # Next.js 15.2.1 (React 19) — Customer Storefront (Port 3000)
│   ├── admin/         # Next.js 15.2.1 (React 19) — Administration Console (Port 3001)
│   ├── api/           # Express 4.21.2 + Socket.IO + Mongoose + Redis (Port 4000)
│   └── worker/        # BullMQ 5.41.6 + Redis worker service
├── packages/
│   ├── config/        # Base ESLint & TSConfig shared presets
│   ├── types/         # Domain TypeScript models and DTO interfaces
│   ├── validators/    # Zod schemas for input validation
│   └── utils/         # Currency, formatting, and helper utilities
└── infra/             # Docker compose manifests and deployment configurations
```

### Core Technologies Matrix

| Layer / Package       | Technology                   | Version                                     | Purpose                                   |
| :-------------------- | :--------------------------- | :------------------------------------------ | :---------------------------------------- |
| **Workspace Runtime** | Node.js                      | `>=24.13.0`                                 | Server runtime                            |
| **Monorepo Tooling**  | Turborepo + npm workspaces   | `turbo ^2.4.4`                              | Build orchestration & task caching        |
| **Storefront Web**    | Next.js (App Router) + React | `next ^15.2.1`, `react ^19.0.0`             | E-commerce Storefront UI                  |
| **Admin Console**     | Next.js (App Router) + React | `next ^15.2.1`, `react ^19.0.0`             | Backoffice Dashboard & Operations         |
| **Styling**           | Tailwind CSS v4 + Radix UI   | `tailwindcss ^4.0.9`, `@radix-ui/*`         | Design system & headless primitives       |
| **Client State**      | Zustand                      | `zustand ^5.0.3`                            | In-memory client auth, cart, UI state     |
| **Server State**      | TanStack React Query         | `@tanstack/react-query ^5.66.0`             | Client data fetching & cache management   |
| **Backend API**       | Express + Pino + Helmet      | `express ^4.21.2`                           | REST API, WebSockets & Auth server        |
| **Database**          | MongoDB (Mongoose)           | `mongoose ^8.10.1`                          | Primary document database                 |
| **Cache & Queue**     | Redis + BullMQ               | `ioredis ^5.6.0`, `bullmq ^5.81.5`          | Cache, rate limiting, and background jobs |
| **Testing**           | Vitest + Playwright          | `vitest ^3.0.5`, `@playwright/test ^1.65.1` | Unit & end-to-end integration testing     |

---

## 2. Existing Folder Structure & Module Organization

### Web Storefront (`apps/web/src`)

- `app/`: Next.js App Router root.
  - Route groups / pages: `account/`, `cart/`, `category/[slug]/`, `categories/[slug]/`, `checkout/`, `collections/`, `new-arrivals/`, `notifications/`, `orders/`, `products/`, `products/[slug]/`, `profile/`, `shop/`, `tracking/`, `login/`, `register/`, `verify-otp/`.
  - Layout & Global styles: `layout.tsx`, `globals.css`, `not-found.tsx`.
- `components/`:
  - `ui/`: 32 local shadcn/ui components (`button.tsx`, `dialog.tsx`, `drawer.tsx`, etc.).
  - `storefront/`: Product cards, grids, accordions, gallery, catalog filters, home sections.
  - `navigation/`: Navbar, Announcement bar, Search dialog, Footer.
  - `notifications/`: Drawer, list, item, and notification hooks.
  - `common/`: `auth-loading-screen.tsx`, `protected-route.tsx`, `theme-toggle.tsx`.
- `hooks/`: `use-catalog.ts`, `use-profile.ts`.
- `lib/hooks/`: **Secondary hooks directory** (`use-addresses.ts`, `use-cart.ts`, `use-checkout.ts`, `use-orders.ts`, `use-payment.ts`, `use-wishlist.ts`).
- `lib/api/`: `api-client.ts`, domain API wrappers (`catalog-api.ts`, `auth-api.ts`, etc.), `query-client.ts`, `query-keys.ts`.
- `stores/`: Zustand stores (`auth-store.ts`, `cart-store.ts`, `ui-store.ts`, `wishlist-store.ts`).
- `providers/`: `app-providers.tsx`, `auth-provider.tsx`, `query-provider.tsx`, `socket-provider.tsx`, `theme-provider.tsx`.

### Admin Console (`apps/admin/src`)

- `app/`: Next.js App Router root.
  - Dashboard & Operations routes: `audit-logs/`, `brands/`, `categories/`, `collections/`, `coupons/`, `customers/`, `customers/[id]/`, `inventory/`, `inventory/[id]/`, `login/`, `orders/`, `products/`, `products/new/`, `products/[id]/`, `profile/`, `reviews/`, `roles/`, `settings/`, `shipments/`, `staff/`.
  - Layout & Global styles: `layout.tsx`, `globals.css` (**No `not-found.tsx`**).
- `components/`:
  - `ui/`: 32 local shadcn/ui components (identical to `apps/web/src/components/ui/`).
  - `layout/`: `admin-layout.tsx`, `admin-sidebar.tsx`, `admin-header.tsx`, `page-container.tsx`.
  - `dashboard/`: Analytics charts, KPI metric cards, quick actions.
  - `common/`: `admin-auth-loading-screen.tsx`, `admin-protected-route.tsx`, `data-table.tsx`.
- `hooks/`: `use-admin-profile.ts`.
- `lib/api/`: `api-client.ts` (forked duplicate of web's client), domain admin API services.
- `stores/`: `admin-auth-store.ts`, `admin-ui-store.ts`.
- `providers/`: Mirror of web providers with admin-specific auth handling.

---

## 3. Web and Admin Architectural Differences

| Dimension                   | Web Storefront (`@veyora/web`)                                                                                            | Admin Portal (`@veyora/admin`)                                                                 | Architectural Evaluation                                                                           |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **Server Components Usage** | Hybrid: `category/[slug]` & `products/[slug]` are async Server Components. Homepage and shop catalog are client-rendered. | **100% Client-Side**: All pages are declared `"use client"`.                                   | Admin completely bypasses Next.js SSR benefits; Web partially leverages it for dynamic PDPs.       |
| **Root Shell**              | Server Component layout (`RootLayout` in `layout.tsx` is server-rendered).                                                | **Client Component shell**: `AdminLayout` has `"use client"`, wrapping the entire application. | Forces all admin child routes and navigation into client execution.                                |
| **Route Protection**        | Page-level `<ProtectedRoute>` wrapper around customer profile and account routes.                                         | Global layout `<AdminProtectedRoute>` intercepting all paths except `/login`.                  | Both rely strictly on client-side React `useEffect` navigation; neither uses edge `middleware.ts`. |
| **Data Fetching Strategy**  | TanStack Query client fetching on homepage/shop; direct Server Component `fetch` on PDP/Category.                         | 100% TanStack Query client-side fetching with inline loading spinners.                         | High client CPU and waterfall latency on Admin initial load.                                       |
| **Typography & Fonts**      | `next/font/google` loading `Poppins` (and serif tokens).                                                                  | **No `next/font` configuration**; relies on system default sans-serif.                         | Missing font optimization and layout shift prevention in Admin.                                    |
| **SEO & Metadata**          | Implemented: `metadataBase`, OpenGraph, Twitter, canonical links, and JSON-LD schemas.                                    | Basic static title and description only.                                                       | Appropriate for Admin, but Web has un-hydrated metadata on client pages.                           |
| **Error Handling**          | Has `not-found.tsx`. Lacks `error.tsx` and `loading.tsx`.                                                                 | **Lacks all boundaries**: No `not-found.tsx`, `error.tsx`, or `loading.tsx`.                   | Admin crashes entirely to white-screen on unhandled render errors.                                 |

---

## 4. Issues Categorized by Severity

### Critical Severity (P0 — Architecture & Security)

#### 1. Zero Edge/Server Route Guards (`middleware.ts` Missing)

- **Finding:** Neither `apps/web` nor `apps/admin` defines a `middleware.ts` file at the app/project root.
- **Impact:** Authentication protection is enforced exclusively via client-side React `useEffect` hooks in `<ProtectedRoute>` and `<AdminProtectedRoute>`. On page refresh or direct URL navigation, the unauthenticated HTML document is delivered to the browser before JavaScript executes, causing flashes of unauthorized content or jarring loading screens.
- **Risk:** Sensitive DOM elements and layout structures are rendered to the client prior to redirect.

#### 2. Monorepo Dependency Version Drift

- **Finding:** Critical database and queue packages differ between `apps/api` and `apps/worker`:
  - `mongoose`: `apps/api` uses `^8.10.1`, while `apps/worker` uses `^8.24.10`.
  - `bullmq`: `apps/api` uses `^5.81.5`, while `apps/worker` uses `^5.41.6`.
- **Impact:** Driver level and queue schema differences between publisher (`apps/api`) and consumer (`apps/worker`) can cause silent deserialization errors, Redis stream parsing bugs, or schema validation mismatches in background jobs.

#### 3. Complete Absence of Next.js Error Boundaries

- **Finding:** Neither application contains an `error.tsx` or `global-error.tsx`.
- **Impact:** An uncaught runtime error in any component (such as an unexpected null property in a product variant or coupon) crashes the entire React fiber tree into an unhandled client crash instead of displaying an isolated recovery UI.

---

### High Severity (P1 — Performance & Next.js Patterns)

#### 4. Unnecessary Client-Side Rendering on Storefront Homepage & Catalog

- **Finding:** `apps/web/src/app/page.tsx` and `apps/web/src/app/shop/page.tsx` are marked with `"use client"`.
- **Impact:** The storefront homepage and shop catalog do not generate pre-rendered HTML for products, hero banners, or categories. Search engines receive an empty skeleton. Initial load metrics (FCP, LCP, TTFB) suffer because data fetching is delayed until client bundles download, parse, and execute.
- **Solution:** Convert `page.tsx` and `shop/page.tsx` into async Server Components that fetch initial catalog data on the server with Next.js revalidation, passing data into interactive client child components.

#### 5. Missing Next.js Streaming Suspense Boundaries (`loading.tsx`)

- **Finding:** Zero `loading.tsx` files exist across both applications.
- **Impact:** Next.js App Router streaming is disabled. Navigation between routes blocks until client code or dynamic data is ready, rather than instantly displaying instant loading skeletons.

#### 6. Dockerfile Missing Next.js Standalone Output Optimization

- **Finding:** `apps/web/Dockerfile` and `apps/admin/Dockerfile` copy the entire root `node_modules` into the production runner container and execute via `npm run start`.
- **Impact:** Container images exceed 1GB+ in size, include unnecessary dev dependencies, and incur high memory overhead. Neither `next.config.mjs` enables `output: "standalone"`.

#### 7. 100% Code Duplication in UI Primitives and API Clients

- **Finding:**
  - 32 shadcn/ui components are duplicated verbatim in `apps/web/src/components/ui/` and `apps/admin/src/components/ui/`.
  - `apps/web/src/lib/api/api-client.ts` (308 lines) and `apps/admin/src/lib/api/api-client.ts` (279 lines) contain identical refresh token mutex logic, guest ID handling, and error formatting.
- **Impact:** High maintenance burden; bug fixes applied to one API client or UI component are frequently omitted from the other.

---

### Medium Severity (P2 — Code Quality & Maintainability)

#### 8. Fractured Hooks Directory Structure in Web Application

- **Finding:** Hooks in `apps/web` are split across `src/hooks/` (`use-catalog.ts`, `use-profile.ts`), `src/lib/hooks/` (`use-cart.ts`, `use-checkout.ts`, `use-orders.ts`, etc.), and `src/components/notifications/hooks/`.
- **Impact:** Inconsistent imports across team members and confusing discovery.

#### 9. ESLint Configuration Lacks Next.js Plugin Rules

- **Finding:** Root `eslint.config.mjs` uses `typescript-eslint` but does not include `@next/eslint-plugin-next` rules (`next/core-web-vitals`).
- **Impact:** Violations of Next.js rules (e.g. invalid `next/link` usage, unoptimized image tags, incorrect Server Action signatures) pass CI without warnings.

#### 10. Lack of Next.js Server Cache Tags & Revalidation Invalidation

- **Finding:** `catalogApi` calls `apiClient.request()` without specifying Next.js caching options (`next: { tags: [...] }` or `next: { revalidate: ... }`).
- **Impact:** When an administrator updates a product or price in Admin, the Storefront cannot selectively invalidate the cache tag on the server.

---

### Low Severity (P3 — Polish & Optimization)

#### 11. Admin Application Missing Font Optimization

- **Finding:** `apps/admin/src/app/layout.tsx` does not utilize `next/font`, falling back to un-optimized system fonts, causing layout shifts.

#### 12. Redundant Tooling Dependencies

- **Finding:** Both `apps/web` and `apps/admin` list `@vitejs/plugin-react` in `devDependencies` (for Vitest), and monorepo root includes `concurrently` while `turbo` is already installed.

---

## 5. Recommended Migration Plan

### Phase 1: Stability & Security Foundation

1. **Implement Next.js Edge Middleware (`middleware.ts`)**:
   - Add `apps/admin/src/middleware.ts` to inspect the `refreshToken` HTTP-only cookie before allowing access to dashboard routes.
   - Add `apps/web/src/middleware.ts` to protect `/account/*` and `/orders/*` routes at the edge.
2. **Align Monorepo Dependencies**:
   - Harmonize `mongoose` (`8.10.x` or `8.24.x`) and `bullmq` across `apps/api` and `apps/worker`.
3. **Add Global and Route Error Boundaries**:
   - Create `error.tsx` and `not-found.tsx` in `apps/admin/src/app/`.
   - Create `global-error.tsx` and `error.tsx` in `apps/web/src/app/`.

### Phase 2: Performance & Server Component Migration

1. **Refactor Storefront Homepage & Catalog to Server Components**:
   - Transform `apps/web/src/app/page.tsx` into an async Server Component with server-side pre-fetching.
   - Extract interactive sliders, quick-view, and variant tabs into client leaf components.
   - Transform `apps/web/src/app/shop/page.tsx` into an async Server Component receiving `searchParams`.
2. **Implement App Router Streaming (`loading.tsx`)**:
   - Add `loading.tsx` skeletons for `/shop`, `/category/[slug]`, `/products/[slug]`, and `/admin/*`.
3. **Enable Standalone Docker Builds**:
   - Add `output: "standalone"` to `apps/web/next.config.mjs` and `apps/admin/next.config.mjs`.
   - Update Dockerfiles to copy `.next/standalone` and `.next/static`.

### Phase 3: Monorepo Consolidation & DRY Refactoring

1. **Create Shared `@veyora/ui` Package**:
   - Move shared shadcn/ui components (`button`, `dialog`, `input`, `select`, etc.) into `packages/ui/`.
2. **Consolidate API Client in `@veyora/utils` or `@veyora/api-client`**:
   - Unify the base `ApiClient` class, token refresh mutex, and error types into a shared package.
3. **Consolidate Web Hooks**:
   - Standardize all web hooks into `apps/web/src/hooks/`.
4. **Configure Next.js ESLint Plugin**:
   - Integrate `@next/eslint-plugin-next` into `eslint.config.mjs`.

---

## 6. Dependency Compatibility Risks

| Dependency                | Location                    | Current State         | Risk Description                                                                                                                                                                     |
| :------------------------ | :-------------------------- | :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`react` & `react-dom`** | `apps/web`, `apps/admin`    | `^19.0.0`             | React 19 is supported in Next.js 15, but some third-party libraries (e.g., older drag-and-drop or rich text editors) may throw peer dependency warnings during installs.             |
| **`mongoose`**            | `apps/api` vs `apps/worker` | `8.10.1` vs `8.24.10` | Discrepancy in MongoDB driver versions can cause subtle query cursor differences or connection pooling issues.                                                                       |
| **`bullmq`**              | `apps/api` vs `apps/worker` | `5.81.5` vs `5.41.6`  | Producer and consumer use different BullMQ protocol revisions. Job metadata and retry states may experience serialization discrepancies in Redis.                                    |
| **`tailwindcss`**         | Monorepo                    | `^4.0.9`              | Tailwind v4 uses `@theme inline` in CSS instead of `tailwind.config.js`. Certain legacy plugins and shadcn templates expecting `tailwind.config.ts` must use CSS variables directly. |

---

## 7. Files Likely to Require Changes in Next Phase

### Storefront Web (`apps/web`)

- `apps/web/src/middleware.ts` _(New file)_ — Server edge auth routing and guest session assignment.
- `apps/web/src/app/page.tsx` — Server Component conversion for instant SSR and metadata.
- `apps/web/src/app/shop/page.tsx` — Server Component conversion with `searchParams` prop.
- `apps/web/src/app/error.tsx` _(New file)_ — Route error boundary.
- `apps/web/src/app/global-error.tsx` _(New file)_ — Root layout fatal error boundary.
- `apps/web/src/app/loading.tsx` _(New file)_ — Streaming Suspense fallback.
- `apps/web/next.config.mjs` — Add `output: "standalone"`.
- `apps/web/src/lib/hooks/*` — Relocate to `apps/web/src/hooks/`.

### Admin Portal (`apps/admin`)

- `apps/admin/src/middleware.ts` _(New file)_ — Admin role verification and login redirection at edge.
- `apps/admin/src/app/layout.tsx` — Add `next/font` configuration.
- `apps/admin/src/app/error.tsx` _(New file)_ — Admin crash boundary.
- `apps/admin/src/app/not-found.tsx` _(New file)_ — 404 handler for missing admin routes.
- `apps/admin/src/app/loading.tsx` _(New file)_ — Dashboard streaming skeletons.
- `apps/admin/next.config.mjs` — Add `output: "standalone"`.

### Backend & Shared Packages

- `apps/worker/package.json` — Align `mongoose` and `bullmq` versions with `apps/api`.
- `eslint.config.mjs` — Integrate `@next/eslint-plugin-next`.
- `packages/ui/` _(New package)_ — Shared design system primitives.

---

## 8. Features Requiring Regression Tests

Whenever refactoring occurs, the following critical workflows must be validated via Playwright E2E and Vitest:

1. **Customer Authentication & Session Restoration:**
   - Registration with password complexity and email OTP.
   - Login, JWT access token retention, and automatic refresh on browser reload.
   - Guest ID cart persistence across unauthenticated sessions.
2. **Product Catalog & Dynamic Discovery:**
   - Server-side pre-rendered catalog filtering by category, size, color, and price.
   - Dynamic search suggestions and instant keyboard navigation.
   - Product details variant switching (updating SKU, price, inventory badge).
3. **Cart & Multi-Step Checkout:**
   - Add to bag from PDP, quick-view, and catalog cards.
   - Coupon code validation (`ATELIER10`, percentage vs fixed discount).
   - Address selection (saved address vs new address form).
   - Razorpay payment order initiation and HMAC signature verification.
4. **Admin Dashboard Operations:**
   - Role-based route guard preventing non-admin access.
   - CRUD operations on products, variants, and image galleries.
   - Live inventory adjustments and stock movement audit logs.
   - Order fulfillment status progression (Pending → Confirmed → Shipped → Delivered).
5. **Real-time WebSockets:**
   - Notification delivery on order status changes.
   - Real-time stock depletion broadcasts.

---

## Conclusion

The Veyora repository possesses a clean TypeScript foundation with strong types and comprehensive testing tooling. By addressing the identified Server/Client Component boundaries, implementing Next.js streaming and error boundaries, adding Edge middleware, and deduplicating UI primitives, the platform will achieve exceptional production performance, robust security, and seamless developer velocity.

---

## Task 18 — Stabilization Addendum (2026-11-25)

The repository’s current package versions and production checks have since changed from the earlier architecture snapshot above. The eight workspace typecheck passed, the initial eight ESLint `any` warnings were removed, and the E2E mock server was isolated from developer API processes. CD and Docker/Compose configuration also received release-safety fixes. The live baseline, exact commands, results, AWS limitations, and remaining conditions are tracked in [the Task 18 stabilization report](engineering/18-monorepo-stabilization.md).
