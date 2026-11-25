# Migration Guide: Task 20 — Accessibility & Performance Optimization

## 1. Summary of Changes

This migration executes an accessibility (a11y) and frontend performance optimization pass across `@veyora/web` and `@veyora/admin`.

---

## 2. File-by-File Changes

| Component / File                                              | Type     | Changes Implemented                                                                                                                     |
| ------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/login/page.tsx`                             | Modified | Removed `tabIndex={-1}` from password show/hide button; upgraded focus indicator to `focus-visible:ring-2 focus-visible:ring-offset-2`. |
| `apps/admin/src/app/login/page.tsx`                           | Modified | Removed `tabIndex={-1}` from password show/hide button; upgraded focus indicator to `focus-visible:ring-2 focus-visible:ring-offset-2`. |
| `apps/admin/src/components/layout/admin-nav.tsx`              | Modified | Added `aria-label="Admin Navigation"`, `aria-current="page"` on active route, and `aria-label={item.title}` when sidebar is collapsed.  |
| `apps/admin/src/components/layout/admin-sidebar.tsx`          | Modified | Converted broad store destructuring to narrow selectors for `sidebarCollapsed` and `toggleSidebar`.                                     |
| `apps/web/src/components/navigation/navbar/NavbarMobile.tsx`  | Modified | Converted store destructuring to narrow selectors; added `<nav aria-label="Mobile Navigation">` landmark.                               |
| `apps/web/src/components/ui/form.tsx`                         | Modified | Added `role="alert"` and `aria-live="polite"` to `FormMessage`; hardened `useFormField` against null contexts.                          |
| `apps/admin/src/components/ui/form.tsx`                       | Modified | Added `role="alert"` and `aria-live="polite"` to `FormMessage`; hardened `useFormField` against null contexts.                          |
| `apps/web/src/components/ui/input.tsx`                        | Modified | Enhanced focus ring appearance with `focus-visible:ring-2 focus-visible:ring-offset-2` and `aria-[invalid=true]:border-destructive`.    |
| `apps/admin/src/components/ui/input.tsx`                      | Modified | Enhanced focus ring appearance with `focus-visible:ring-2 focus-visible:ring-offset-2` and `aria-[invalid=true]:border-destructive`.    |
| `apps/web/src/components/ui/button.tsx`                       | Modified | Enhanced focus ring appearance with `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background`.            |
| `apps/admin/src/components/ui/button.tsx`                     | Modified | Enhanced focus ring appearance with `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background`.            |
| `apps/admin/src/app/dashboard-client.tsx`                     | Modified | Dynamically imported heavy Recharts chart components (`RevenueChart`, `OrderStatusChart`, etc.) with skeleton loading fallbacks.        |
| `apps/web/src/components/storefront/wishlist-button.tsx`      | Modified | Added `aria-pressed={active}` to communicate toggle button state.                                                                       |
| `apps/web/src/components/storefront/variant-selector.tsx`     | Modified | Added `role="radiogroup"` and `aria-label` on color and size groups; added `aria-pressed` on active variants.                           |
| `apps/web/src/components/storefront/product-gallery.tsx`      | Modified | Added `aria-roledescription="carousel"`, `aria-label="Product image gallery"`, and `aria-current` on thumbnail buttons.                 |
| `apps/web/src/components/storefront/product-card.tsx`         | Modified | Replaced hardcoded 4.9 rating with real API data checks; added touch target hit expanders on color swatches.                            |
| `apps/web/src/components/navigation/search/SearchResults.tsx` | Modified | Added `aria-live="polite"` and `aria-atomic="true"` on results container.                                                               |
| `apps/web/src/components/navigation/search/SearchInput.tsx`   | Modified | Added `<span className="sr-only">Loading search results</span>` and updated `aria-label`.                                               |
| `apps/web/src/test/accessibility-and-performance.test.tsx`    | Created  | 8 automated tests for storefront landmarks, form alerts, ARIA states, and focus appearance.                                             |
| `apps/admin/src/test/accessibility-and-performance.test.tsx`  | Created  | 6 automated tests for admin navigation landmarks, collapsed state labels, and form error alerts.                                        |

---

## 3. Verification & Compliance Checklist

- [x] Password visibility toggles are fully keyboard accessible (no `tabIndex={-1}`).
- [x] Inline form validation errors announce via `role="alert"` and `aria-live="polite"`.
- [x] Input elements visually and programmatically reflect `aria-invalid="true"`.
- [x] Focus indicators upgraded to 2px with offset across both light and dark themes.
- [x] Admin navigation marks active page via `aria-current="page"`.
- [x] Collapsed admin navigation items provide accessible names via `aria-label`.
- [x] Storefront skip navigation links correctly target `#main-content` and `#admin-main`.
- [x] Color swatches provide touch target expanders meeting touch accessibility guidelines.
- [x] Recharts components dynamically imported to optimize dashboard initial script size.
- [x] Zustand selectors optimized to prevent unnecessary component re-renders.
- [x] 14 dedicated accessibility tests passing across Web and Admin.
- [x] 0 TypeScript compilation errors in `@veyora/web` and `@veyora/admin`.
