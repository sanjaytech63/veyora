# Migration & Defect Correction Log: Task 22 — Web Storefront Verification & Hardening

**Project**: Veyora Atelier  
**Scope**: `apps/web`  
**Date**: November 2026

---

## 1. Defect Inventory & Corrections

### Defect 1: Open Redirect Vulnerability in Web LoginForm [Medium]

- **Affected Module**: `apps/web/src/app/login/page.tsx`
- **Root Cause**: `redirectPath` was read directly from `searchParams.get("redirect") || "/"` without sanitization.
- **Business Impact**: A malicious link (`/login?redirect=https://phishing.site`) could redirect authenticated customers to an external site.
- **Fix Applied**: Integrated `getSafeRedirectUrl(rawRedirect, "/")` from `@/proxy` and added redirect loop protection:
  ```tsx
  const redirectPath = React.useMemo(() => {
    const safe = getSafeRedirectUrl(rawRedirect, "/");
    return safe === "/login" ? "/" : safe;
  }, [rawRedirect]);
  ```
- **Focused Verification**: Verified in `apps/web/src/test/web-verification-and-hardening.test.tsx` (all open redirect tests passed).
- **Remaining Risk**: None.

---

### Defect 2: Mixed WAI-ARIA Semantics in Product Variant Selector [Medium]

- **Affected Module**: `apps/web/src/components/storefront/variant-selector.tsx`
- **Root Cause**: The options container declared `role="radiogroup"`, but child buttons used `aria-pressed={isSelected}` instead of `role="radio"` and `aria-checked={isSelected}`.
- **Business Impact**: Confusing screen-reader announcements violating W3C WAI-ARIA specifications for radio group controls.
- **Fix Applied**: Updated color and size buttons to `role="radio"` with `aria-checked={isSelected}`, removing `aria-pressed`.
- **Focused Verification**: Verified in `accessibility-and-performance.test.tsx` and `web-verification-and-hardening.test.tsx`.
- **Remaining Risk**: None.

---

### Defect 3: Duplicate Route Aliasing & SEO Redundancy on `/categories/[slug]` [Medium]

- **Affected Module**: `apps/web/src/app/categories/[slug]/page.tsx`
- **Root Cause**: Page imported and re-rendered `CategoryPage` directly from `../../category/[slug]/page`, creating duplicate URL paths and canonical ambiguity.
- **Business Impact**: Search engine crawl dilution and potential duplicate content penalties.
- **Fix Applied**: Replaced re-export with clean Next.js App Router redirect to `/category/${slug}`:
  ```tsx
  import { redirect } from "next/navigation";
  export default async function CategoriesRedirectPage({ params }: PageProps) {
    const { slug } = await params;
    redirect(`/category/${slug}`);
  }
  ```
- **Focused Verification**: Verified category redirect resolution and metadata canonical consistency.
- **Remaining Risk**: None.

---

### Defect 4: Return Destination Loss on `/profile` Protected Route [Low]

- **Affected Module**: `apps/web/src/components/common/protected-route.tsx`
- **Root Cause**: `pathname !== "/profile"` was explicitly excluded from `redirectQuery`, meaning visitors navigating to `/profile` while unauthenticated were sent to `/` after signing in.
- **Business Impact**: Minor customer friction requiring patrons to click their profile a second time after login.
- **Fix Applied**: Allowed `/profile` to be preserved in `?redirect=/profile` while maintaining exclusions for `/` and `/account`.
- **Focused Verification**: Verified return query retention in `protected-route.tsx`.
- **Remaining Risk**: None.

---

### Defect 5: Responsive Navbar Actions Truncation on Laptop Displays [Medium]

- **Affected Module**: `apps/web/src/components/navigation/navbar/NavbarDesktop.tsx`, `NavbarActions.tsx`
- **Root Cause**: Expanded search pill activated at `lg:` (1024px), causing horizontal row overflow on 1024px–1279px displays and pushing "Sign In" off the screen edge.
- **Business Impact**: Customers could not see or click "Sign In" on standard laptop displays.
- **Fix Applied**: Switched expanded search pill to `hidden xl:flex` (>= 1280px) and compact search icon to `xl:hidden`. Added `shrink-0` to the Sign In button.
- **Focused Verification**: Verified navbar visual alignment and button accessibility.
- **Remaining Risk**: None.

---

## 2. Test Execution Matrix

| Test Suite                                | Purpose                                       | Status           | Details                  |
| :---------------------------------------- | :-------------------------------------------- | :--------------- | :----------------------- |
| `web-verification-and-hardening.test.tsx` | Auth, Open Redirect, Variant A11y, Cache Tags | Passed           | 9 tests passed           |
| `proxy.test.ts`                           | Proxy Gatekeeper, Protected Routes, Safe URLs | Passed           | 11 tests passed          |
| `seo-and-metadata.test.ts`                | Metadata, Canonicals, Safe JSON-LD            | Passed           | 19 tests passed          |
| `accessibility-and-performance.test.tsx`  | Skip Link, Form Alerts, Radiogroups, Gallery  | Passed           | 8 tests passed           |
| `server-api-client-cache.test.ts`         | Server Fetch Cache Isolation, Tag Contracts   | Passed           | 9 tests passed           |
| **Total Test Coverage**                   | **5 Focused Suites**                          | **100% Passing** | **56 tests, 0 failures** |

---

## 3. Unverified Integrations & Limitations

1. **Live Razorpay Gateway Verification**:
   - Signature validation logic (`crypto.createHmac('sha256', secret)`) is verified in unit tests and Express middleware.
   - Live payment authorization with real bank webhooks cannot be executed in this sandboxed local test environment without external live credentials.
2. **Items Deferred to Task 24**:
   - Comprehensive end-to-end integration across Web + Admin + Express + Redis + BullMQ.
   - Full monorepo production build verification (`next build`).
