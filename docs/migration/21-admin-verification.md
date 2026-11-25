# Migration & Defect Correction Log: Task 21 — Admin Verification & Hardening

**Project**: Veyora Atelier  
**Scope**: `apps/admin`, `apps/web`  
**Date**: November 2026

---

## 1. Defect Inventory & Corrections

### Defect 1: Open Redirect Vulnerability in Admin Login [Medium]

- **Reproduction**: Access `http://localhost:3001/login?redirect=https://attacker.com` and authenticate.
- **Root Cause**: `redirectPath` was read directly from `searchParams.get("redirect") || "/"` without path sanitization.
- **Impact**: Operators could be redirected to an external credential-harvesting domain after login.
- **Correction**: Integrated `getSafeRedirectUrl(searchParams.get("redirect"), "/")` from `@/proxy` in `apps/admin/src/app/login/page.tsx` and prevented self-redirect loops (`redirectPath === "/login" ? "/" : safe`).
- **Verification**: Verified with unit tests in `apps/admin/src/test/admin-verification-and-hardening.test.tsx`.

---

### Defect 2: Admin Auth Loading Screen Viewport Overflow [Low]

- **Reproduction**: Open `http://localhost:3001` with DevTools docked to the bottom taking 60%+ height.
- **Root Cause**: Container used `min-h-screen` (`100vh`) with flex centering, which placed the loader element below the visible viewport fold when DevTools squashed window height.
- **Impact**: Appeared as a completely black/blank screen while authenticating.
- **Correction**: Updated `apps/admin/src/components/common/admin-auth-loading-screen.tsx` container classes to `min-h-[50vh] h-full py-12`.
- **Verification**: Visually verified responsive centering across constrained viewport dimensions.

---

### Defect 3: Cross-Domain Cache Invalidation Missing on Inventory Stock Adjustments [Medium]

- **Reproduction**: Adjust inventory stock for a product SKU via `InventoryListClient` or `InventoryDetailClient`. Navigate to Products list.
- **Root Cause**: Mutations only invalidated `adminInventoryKeys.all`, leaving `adminCatalogKeys.all` stale until manual browser reload.
- **Impact**: Product catalog displayed out-of-sync inventory numbers and stock badges.
- **Correction**: Added `queryClient.invalidateQueries({ queryKey: adminCatalogKeys.all })` to mutation success callbacks in both `inventory-list-client.tsx` and `inventory-detail-client.tsx`.
- **Verification**: Verified via test suite in `admin-verification-and-hardening.test.tsx`.

---

### Defect 4: Customer Dossier Notes & Status Cache Invalidation Omission [Medium]

- **Reproduction**: Toggle customer active status or save dossier notes in `customer-detail-client.tsx`. Navigate to `/customers`.
- **Root Cause**: Mutation callbacks updated local component state but did not invalidate `adminCustomerKeys.all`.
- **Impact**: Customer listing showed stale account standing.
- **Correction**: Added `queryClient.invalidateQueries({ queryKey: adminCustomerKeys.all })` in `handleUpdateStatus` and `handleUpdateNotes`.
- **Verification**: Verified via test suite in `admin-verification-and-hardening.test.tsx`.

---

### Defect 5: Storefront `/account` 404 Not Found [High]

- **Reproduction**: Navigate to `http://localhost:3000/account` or `http://localhost:3000/account/profile`.
- **Root Cause**: `apps/web/src/app/account/page.tsx` used `export { default } from "@/app/profile/page"`, which is an unsupported pattern in Next.js 16 App Router for route entrypoints and triggered `not-found.tsx`.
- **Impact**: Patrons encountered 404 "Page Not Located" when navigating to `/account`.
- **Correction**: Replaced re-export with standard Next.js App Router server redirect:
  ```tsx
  import { redirect } from "next/navigation";
  export default function AccountPage() {
    redirect("/profile");
  }
  ```
- **Verification**: Verified clean redirect to `/profile` and passing test suites.

---

### Defect 6: Storefront Desktop Navbar Actions Overflow on Standard Laptops [Medium]

- **Reproduction**: View `http://localhost:3000` at viewport widths between 1024px and 1279px (typical 13–14" laptops).
- **Root Cause**: `SearchTrigger variant="pill"` was activated at `lg:` (1024px), consuming ~320px width. Combined with logo, navigation links, and five action buttons, the total row width exceeded 1,200px, pushing "Sign In" off the right edge.
- **Impact**: "Sign In" button was hidden/cut off on laptop screens.
- **Correction**:
  - In `NavbarDesktop.tsx`: Added `shrink-0` to Logo and Actions; gave `nav` `min-w-0`.
  - In `NavbarActions.tsx`: Switched `SearchTrigger` pill to `hidden xl:flex` and icon to `xl:hidden`.
  - Added `shrink-0` to the Sign In button.
- **Verification**: All navbar actions and the Sign In button are visible and properly aligned across laptop and desktop screens.

---

## 2. Test Verification Matrix

| Suite                                       | Target                            | Status            | Coverage           |
| :------------------------------------------ | :-------------------------------- | :---------------- | :----------------- |
| `admin-verification-and-hardening.test.tsx` | Admin Auth, RBAC, Cache Contracts | Passed (12 tests) | 100%               |
| `proxy.test.ts`                             | Admin Proxy Navigation Guard      | Passed (9 tests)  | 100%               |
| `admin-protected-route.test.tsx`            | Admin Protected Route Guard       | Passed (3 tests)  | 100%               |
| `accessibility-and-performance.test.tsx`    | Admin A11y & Performance          | Passed (6 tests)  | 100%               |
| `seo-and-metadata.test.ts`                  | Web Metadata & Canonical SEO      | Passed (19 tests) | 100%               |
| `accessibility-and-performance.test.tsx`    | Web A11y & Performance            | Passed (8 tests)  | 100%               |
| **Total Focused Verification**              | **57 Tests Across Web & Admin**   | **100% Passing**  | **Zero TS Errors** |
