# Veyora Web Storefront Layout Architecture & Provider Standardization

**Document ID:** `DOC-MIG-08-WEB-LAYOUT`  
**Execution Date:** November 24, 2026  
**Target Application:** `@veyora/web` (Port 3000)  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, Webpack Compiler, Tailwind CSS v4)  
**Status:** Completed & Verified

---

## 1. Executive Summary

As part of Task 08, the storefront layout hierarchy and provider composition for `@veyora/web` was standardized to establish clear separation between document-level responsibilities, client-side provider scoping, semantic accessibility landmarks, and route-level UI shells.

Prior to this task, the storefront layout rendered global navigation unconditionally without an accessible skip navigation link, the TanStack Query client lacked an explicit cache invalidation hook upon session expiration or operator logout (creating potential cache leakage between authenticated patrons), and `ProductDetailPage` unconditionally converted ordinary network or 500 API errors into 404 responses.

Task 08 resolved these issues while strictly preserving all existing public storefront URLs, design system styling, customer buying stages, and stateful store integrations.

---

## 2. Existing vs. Final Layout Hierarchy

### Initial Hierarchy

```
apps/web/src/app/
├── layout.tsx (Server Component: HTML, Body, Poppins font, WebSiteJsonLd)
│   └── AppProviders (Client: ThemeProvider -> QueryProvider -> AuthProvider -> SocketProvider -> TooltipProvider -> Toaster)
│       └── StoreLayout (Server: AnnouncementBar -> StoreHeader -> main -> StoreFooter -> MobileBottomNav -> CartDrawer)
│           └── {children}
```

### Standardized Final Hierarchy

```
apps/web/src/app/
├── layout.tsx [Server Component: Document Root]
│   ├── HTML (lang="en", suppressHydrationWarning, Poppins font variable)
│   ├── Body (min-h-screen, antialiased, selection tokens)
│   ├── WebSiteJsonLd (Structured data graph for search engines)
│   └── AppProviders [Client Component: Scoped Contexts]
│       ├── ThemeProvider (class attribute, defaultTheme="system", disableTransitionOnChange)
│       ├── QueryProvider (Singleton QueryClient in browser, request-isolated on server)
│       ├── AuthProvider (Restores patron session via authApi.refreshToken)
│       ├── SocketProvider (Authenticated-only WebSocket connection with cleanup on unmount)
│       ├── TooltipProvider (Global accessible tooltip container)
│       ├── Toaster (Sonner notification container)
│       └── StoreLayout [Server Component: Semantic Storefront Shell]
│           ├── SkipToContent Link (<a href="#main-content" class="sr-only focus:not-sr-only">)
│           ├── AnnouncementBar (Promotional marquee)
│           ├── StoreHeader (Navbar, Category Menu, Search Dialog trigger, Cart counter)
│           ├── <main id="main-content" tabIndex={-1}> (Semantic landmark with focus handling)
│           │   └── {children} (Route-specific page content)
│           ├── StoreFooter (Editorial brand footer, taxonomy links, newsletter)
│           ├── MobileBottomNav (Fixed viewport bottom navigation bar)
│           └── CartDrawer (Global sliding drawer for shopping bag management)
```

---

## 3. Provider Ownership & Lifecycle Governance

### 1. `AppProviders` Composition

All global client providers are composed hierarchically within `apps/web/src/providers/app-providers.tsx`:

- **`ThemeProvider` (`next-themes`):** Handles light/dark mode transitions without hydration flashes.
- **`QueryProvider` (`@tanstack/react-query`):** Manages server-state caching, automatic refetching, and background synchronization.
- **`AuthProvider` (`Zustand` + `authApi`):** Manages patron authentication lifecycle, bearer token provisioning, and automatic session restoration.
- **`SocketProvider` (`socket.io-client`):** Subscribes to real-time events for authenticated patrons (order status updates, shipment dispatches, personal notifications).

### 2. QueryClient Cache Isolation & Invalidation

- **Implementation:** `apps/web/src/lib/api/query-client.ts`
- Added `clearQueryClient()` method:
  ```typescript
  export function clearQueryClient(): void {
    if (browserQueryClient) {
      browserQueryClient.clear();
    }
  }
  ```
- **Session Lifecycle Integration:** In `apps/web/src/stores/auth-store.ts`, `clearAuth()` and `setUnauthenticated()` invoke `clearQueryClient()`.
- **Architectural Guarantee:** When a patron signs out, all cached queries (`customer-orders`, `customer-profile`, `notifications`, etc.) are purged from memory, preventing data leakage across subsequent sessions.

### 3. Socket.IO Connection Scoping

- **Implementation:** `apps/web/src/providers/socket-provider.tsx`
- **Scoping Rule:** Sockets only initialize when `isAuthenticated && user` are valid.
- **Cleanup Rule:** When the patron logs out or the provider unmounts, `socket.disconnect()` is called and state is reset to `null`.
- **Event Listeners:** Single listener registration for `NOTIFICATION_NEW`, `NOTIFICATION_UNREAD_COUNT`, `ORDER_UPDATED`, and `SHIPMENT_UPDATED`.

---

## 4. Route Group & Shell Customizability Decisions

The storefront routes fall into four operational groups:

1. **Public Storefront (`/`, `/shop`, `/products/*`, `/category/*`, `/collections/*`, `/new-arrivals`, `/search`):** Full storefront shell with AnnouncementBar, StoreHeader, StoreFooter, and CartDrawer.
2. **Authentication Pages (`/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password`):** Minimal card layouts embedded within the standard shell, allowing patrons to navigate back or access support without disruptive page refreshes.
3. **Customer Account Pages (`/account/profile`, `/account/notifications`, `/orders`, `/orders/[id]`):** Protected by client route guards (`ProtectedRoute`), utilizing tabular and dashboard styling.
4. **Commerce Pages (`/cart`, `/checkout`):** Focused purchasing funnels retaining the global footer and header while disabling conflicting sliding drawers.

**Decision on Route Groups:** Rather than moving physical filesystem folders into route groups like `(storefront)`, `(auth)`, and `(account)`—which would break existing internal relative imports and increase file relocation risk—layout ownership was standardized within `StoreLayout` and component-level layout containers.

---

## 5. Accessibility Improvements & Landmarks

1. **Skip Navigation Link (WCAG 2.4.1 Bypass Blocks):**
   - Added to `StoreLayout`:
     ```tsx
     <a
       href="#main-content"
       className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:shadow-md focus:ring-2 focus:ring-primary focus:rounded-md text-xs font-medium"
     >
       Skip to main content
     </a>
     ```
2. **Semantic Main Landmark:**
   - The primary content wrapper was updated to `<main id="main-content" tabIndex={-1} className="flex-1 pb-16 md:pb-0 outline-none">`.
   - Allows keyboard screen-reader users to skip repetitive announcement bars and headers directly to page content.
3. **Landmark Hierarchy:**
   - Document contains exactly one `<header>` (`StoreHeader`), one `<main>` landmark, one `<footer>` (`StoreFooter`), and semantic `<nav>` elements (`Navbar`, `MobileBottomNav`, `Breadcrumbs`).

---

## 6. Metadata & SEO Ownership

- **Root Layout Ownership:**
  - `title.default: "Veyora — Minimal Fashion & Precision Hardware"`
  - `title.template: "%s | Veyora"`
  - Canonical origin configured via `metadataBase: new URL("https://veyora.store")`.
  - OpenGraph website cards and Twitter summary image configurations.
- **Dynamic Catalog Metadata:**
  - `apps/web/src/app/products/[slug]/page.tsx` defines `generateMetadata` emitting canonical URL, OpenGraph product images, and editorial descriptions.
  - `apps/web/src/app/category/[slug]/page.tsx` emits category taxonomy metadata.
- **Search Engine Directives:**
  - `robots.ts` allows public storefront indexing while disallowing `/checkout`, `/orders`, `/cart`, and auth pages.
  - `sitemap.ts` dynamically generates sitemap entries for all products, categories, and static storefront routes.

---

## 7. Verification Results

- **Unit Tests:** `npm run test --workspace=@veyora/web` passed 10/10 test files (73 tests passed, including new layout, skip link, error boundary, and cache isolation tests).
- **TypeScript Check:** `npm run typecheck` passed with code `0` across the monorepo.
- **Production Build:** `cd apps/web && npx next build --webpack` completed with code `0`. All 24 routes + `_not-found` + `robots.txt` + `sitemap.xml` generated static pages cleanly.
