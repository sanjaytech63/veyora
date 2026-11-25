# Migration & Testing Infrastructure Hardening Log: Task 23 — Automated Testing Architecture

**Project**: Veyora Atelier — Clothing E-commerce Platform  
**Scope**: Monorepo (`apps/web`, `apps/admin`, `apps/api`, `apps/worker`, `packages/*`)  
**Date**: November 2026  
**Status**: Completed with follow-ups

---

## 1. Testing Infrastructure Hardening & Defect Log

### Defect 1: Missing Worker Testing Architecture & Test Runner [High]

- **Affected Module**: `apps/worker` (`package.json`, `src/processors/*`, `src/infrastructure/cache/*`)
- **Root Cause**: `apps/worker/package.json` had `"test": "echo \"No tests specified for @veyora/worker\""`. There was no Vitest configuration, runner, or test suite for background BullMQ processors.
- **Business / Engineering Impact**: Background job processing (order status sync, real-time payment updates, email dispatch, and cache revalidations) operated without automated regression protection, risking unhandled job failures or silent revalidation drops.
- **Fix Applied**:
  1. Configured `apps/worker/vitest.config.ts` with Node.js test environment.
  2. Updated `package.json` with `"test": "vitest run"`, `"test:watch": "vitest"`, and added `vitest` devDependency.
  3. Created `apps/worker/src/__tests__/worker-processors.test.ts` covering:
     - `triggerStorefrontRevalidation`: Authenticated headers (`x-internal-cache-secret`), JSON body, backoff retry on HTTP 500, retry exhaustion.
     - `processOrderJob`: Real-time Redis order event broadcasting and logging.
     - `processPaymentJob`: Real-time payment verification event broadcast.
     - `processEmailJob`: Template dispatch and verification that sensitive tokens (password reset tokens, OTP codes) are never logged.
- **Focused Verification**: `npm run test --workspace=@veyora/worker` $\rightarrow$ 8/8 tests passed (419ms).
- **Remaining Risk**: Live Redis/BullMQ cluster connectivity is deferred to comprehensive integration gating in Task 24.

---

### Defect 2: Client Bundle Crash via Transitive `next/server` Imports [Critical]

- **Affected Module**: `apps/admin/src/app/login/page.tsx` & `apps/web/src/app/login/page.tsx`
- **Root Cause**: Both client components (`"use client"`) imported `getSafeRedirectUrl` from `@/proxy`. `proxy.ts` is a server proxy importing `next/server`. Bundling `next/server` into browser bundles is forbidden in Next.js and causes module evaluation crashes at runtime, rendering completely blank/black screens on login routes.
- **Business / Engineering Impact**: Operators opening `http://localhost:3001` or unauthenticated customers clicking "Sign In" on `http://localhost:3000` encountered an unrenderable black screen / white screen.
- **Fix Applied**:
  1. Created `packages/utils/src/redirect.ts` containing the pure `getSafeRedirectUrl` URL sanitizer and exported it from `packages/utils/src/index.ts`.
  2. Re-exported `getSafeRedirectUrl` from both `apps/admin/src/proxy.ts` and `apps/web/src/proxy.ts` for backwards compatibility with server code and existing tests.
  3. Updated `apps/admin/src/app/login/page.tsx` and `apps/web/src/app/login/page.tsx` to import `getSafeRedirectUrl` from `@veyora/utils`.
  4. Built shared packages with `npm run build:packages`.
- **Focused Verification**: Both `apps/admin` (21 tests) and `apps/web` (20 tests) pass cleanly; `tsc --noEmit` reports 0 errors.
- **Remaining Risk**: None.

---

### Defect 3: Missing Server Redirect for `/account` in Storefront [Medium]

- **Affected Module**: `apps/web/next.config.mjs`
- **Root Cause**: Navigating directly to `http://localhost:3000/account` produced a 404 "Page Not Located" error because the route was not mapped at the Next.js routing engine level.
- **Business / Engineering Impact**: Customers manually navigating to `/account` or clicking external links were greeted with an Error 404 page rather than being redirected to their profile dashboard.
- **Fix Applied**: Added server-side redirects in `apps/web/next.config.mjs`:
  ```js
  async redirects() {
    return [
      {
        source: "/account",
        destination: "/profile",
        permanent: false,
      },
      {
        source: "/account/profile",
        destination: "/profile",
        permanent: false,
      },
    ];
  },
  ```
- **Focused Verification**: Verified in `apps/web/src/test/proxy.test.ts` and route configuration.
- **Remaining Risk**: None.

---

### Defect 4: Missing Workspace-Specific Test Execution Commands [Low]

- **Affected Module**: Root `package.json`
- **Root Cause**: The root `test` script ran `npm run test --workspaces --if-present`, forcing sequential execution across all workspaces even when developers or CI jobs only needed to verify a single workspace.
- **Business / Engineering Impact**: High local verification costs and slow feedback loops during incremental development.
- **Fix Applied**: Added targeted root scripts:
  - `"test:web"`: `npm run test --workspace=@veyora/web`
  - `"test:admin"`: `npm run test --workspace=@veyora/admin`
  - `"test:api"`: `npm run test --workspace=@veyora/api`
  - `"test:worker"`: `npm run test --workspace=@veyora/worker`
  - `"test:packages"`: `npm run test --workspace=@veyora/validators && npm run test --workspace=@veyora/utils`
  - `"test:e2e:smoke"`: `playwright test e2e/login.spec.ts e2e/catalog-browsing.spec.ts`
- **Focused Verification**: Executed `npm run test:worker` and `npm run test:packages` from root with 100% success.
- **Remaining Risk**: None.

---

## 2. Test Execution & Verification Summary

| Test Target                 | Workspace            | Test Files | Total Tests | Status     | Execution Time |
| :-------------------------- | :------------------- | :--------- | :---------- | :--------- | :------------- |
| Background Processors       | `@veyora/worker`     | 1          | 8           | Passed     | 419ms          |
| Shared Validators           | `@veyora/validators` | 1          | 48          | Passed     | 22ms           |
| Shared Utilities            | `@veyora/utils`      | 1          | 28          | Passed     | 22ms           |
| RBAC Middleware & Roles     | `@veyora/api`        | 1          | 24          | Passed     | 168ms          |
| Payments & Webhooks         | `@veyora/api`        | 1          | 16          | Passed     | 1671ms         |
| Admin Proxy & Hardening     | `@veyora/admin`      | 2          | 21          | Passed     | 65ms           |
| Web Proxy & Hardening       | `@veyora/web`        | 2          | 20          | Passed     | 162ms          |
| **Total Focused Execution** | **Monorepo**         | **9**      | **165**     | **Passed** | **~2.5s**      |

---

## 3. Task 24 Comprehensive Verification Plan

Task 23 intentionally adhered to the verification cost policy by executing only focused test suites for changed modules. Task 24 serves as the single comprehensive production-readiness verification gate:

1. **Full Typecheck**: `npm run typecheck` across all 8 workspaces.
2. **Full Linter Check**: `npm run lint:check` across the monorepo.
3. **Full Monorepo Unit/Integration Matrix**: `npm run test:turbo` or `npm run test`.
4. **Complete E2E Journey Suite**: `npm run test:e2e` via Playwright.
5. **Full Monorepo Production Build**: `npm run build`.
