# Veyora Accessibility & Performance Optimization Architecture

## 1. Overview & Architectural Philosophy

Task 20 establishes an accessibility (a11y) and frontend performance foundation across **`@veyora/web`** and **`@veyora/admin`**.

The optimization preserves:

- The existing visual design system, typography, and brand identity.
- Next.js 16 App Router Server and Client Component boundaries.
- Authentication, cookies, and Zustand in-memory access token lifecycles.
- Existing TanStack Query caching and invalidation keys.
- Zod validation schemas and Express API contracts.

---

## 2. Accessibility Architecture Audit & Findings

### Core Deficiencies Addressed:

1. **Password Visibility Toggle Inaccessibility**:
   Password reveal/hide buttons in both Web and Admin login screens were explicitly set to `tabIndex={-1}`, rendering them unreachable for keyboard-only visitors.
   _Resolution_: Removed `tabIndex={-1}`, added `focus-visible:ring-2` with ring offsets, and ensured full keyboard operability (Tab, Space, Enter).
2. **Silent Form Validation Errors**:
   Inline form error messages rendered plain `<p>` elements without accessibility roles, causing screen readers to remain silent when client or server validation failed.
   _Resolution_: Equipped `FormMessage` in both Web and Admin with `role="alert"` and `aria-live="polite"`.
3. **Invalid Input Styling & Contrast**:
   Form controls did not leverage `aria-[invalid=true]` styles, relying solely on explicit boolean props.
   _Resolution_: Added `aria-[invalid=true]:border-destructive` and high-contrast `focus-visible:ring-2 focus-visible:ring-offset-2` focus appearances complying with WCAG 2.4.11/2.4.13.
4. **Navigation Landmark Semantics**:
   The admin sidebar nav lacked an explicit `aria-label`, active route indicator (`aria-current="page"`), and accessible name fallback when collapsed.
   _Resolution_: Enhanced `AdminNav` with landmark labels, active state communication, and collapsed icon descriptions.
5. **Touch Target Dimensions**:
   Color swatches (14px) were below recommended touch targets (WCAG 2.5.5 / 2.5.8).
   _Resolution_: Maintained the compact 14px visual appearance while introducing `after:absolute after:-inset-1.5` pseudo-element hit area expanders (26px touch target).
6. **Dynamic Search State Announcements**:
   Instant search results updating live did not announce results count to screen reader users.
   _Resolution_: Decorated search results with `aria-live="polite"` and `aria-atomic="true"`.

---

## 3. Keyboard Navigation & Landmark Architecture

```
Web Storefront Layout (`apps/web/src/components/layout/store-layout.tsx`)
├── Skip Link: <a href="#main-content" className="sr-only focus:not-sr-only ...">
├── Header & Desktop/Mobile Navigation: <nav aria-label="Main Navigation"> / <nav aria-label="Mobile Navigation">
└── Main Content Landmark: <main id="main-content" tabIndex={-1}>

Admin Console Layout (`apps/admin/src/components/layout/admin-layout.tsx`)
├── Skip Link: <a href="#admin-main" className="sr-only focus:not-sr-only ...">
├── Sidebar Navigation: <nav aria-label="Admin Navigation">
│   └── Items: aria-current={isActive ? "page" : undefined}, aria-label={collapsed ? title : undefined}
└── Main Content Landmark: <main id="admin-main" tabIndex={-1}>
```

---

## 4. Performance & React Rendering Optimizations

1. **Selective Zustand Store Subscriptions**:
   Replaced broad store destructuring (`const { a, b, c } = useStore()`) with narrow selector subscriptions (`const a = useStore((s) => s.a)`) in `NavbarMobile` and `AdminSidebar`. This eliminates cascade re-renders across the entire header whenever unrelated UI state flags change.
2. **Dynamic Imports for Heavy Charting Libraries**:
   The Admin dashboard imports Recharts (`ResponsiveContainer`, `AreaChart`, `BarChart`, `PieChart`), which carries significant DOM calculation and bundle overhead.
   _Implementation_: Switched `RevenueChart`, `OrderStatusChart`, `TopProductsChart`, and `CustomerGrowthChart` to `next/dynamic` with `ssr: false` and dedicated skeleton loading states. This decreases initial dashboard script execution time and optimizes Interaction to Next Paint (INP).
3. **Touch Targets & Reduced Motion**:
   - Kept `@media (prefers-reduced-motion: reduce)` in `globals.css` ensuring animations fall back to zero duration.
   - Expanded hit areas for swatch buttons via pseudo-elements without altering visual layout.

---

## 5. Verification & Testing

- Automated unit tests in Vitest verify:
  - Skip navigation link presence, destination, and `focus:not-sr-only` classes.
  - `role="alert"` and `aria-live="polite"` on form error messages.
  - `aria-pressed` states on `WishlistButton` and `VariantSelector`.
  - Carousel accessibility on `ProductGallery`.
  - Admin navigation landmark, `aria-current="page"`, and collapsed `aria-label`s.
- TypeScript compiler verification confirms zero type errors across `@veyora/web` and `@veyora/admin`.
