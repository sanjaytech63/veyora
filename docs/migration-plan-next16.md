# Veyora Migration Plan: Web & Admin to Next.js 16.4.x

**Document Version:** 1.0.0  
**Date:** November 24, 2026  
**Status:** Approved for Implementation (Task 02 Complete)  
**Scope:** `@veyora/web`, `@veyora/admin`, Shared Configs & Monorepo Tooling

---

## 1. Executive Summary & Registry Verification

This migration plan defines the exact upgrade path for Veyora's storefront (`@veyora/web`) and administration console (`@veyora/admin`) from **Next.js 15.2.1** to **Next.js 16.4.x**.

### Package Registry Verification

Verification was executed directly against the npm public registry on **November 24, 2026**:

- **Target Version:** `next@16.4.6`
- **npm `dist-tags`:**
  - `latest`: `16.4.6` (Active stable release)
  - `canary`: `16.5.0-canary.62`
  - `preview`: `16.3.0-preview.10`
- **Registry Confirmation:** Next.js 16.4.x is **not** experimental or canary; `16.4.6` is the official, stable, general availability (GA) release designated by the `latest` dist-tag.
- **Node.js Engine Compatibility:** Next.js 16.4.6 requires `node >=20.9.0`. Veyora's monorepo environment enforces `node >=24.13.0`, exceeding the minimum baseline.
- **Peer Dependencies:** `react@^19.0.0` and `react-dom@^19.0.0` are explicitly supported in `next@16.4.6`'s manifest (`peerDependencies: react: "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0"`).

---

## 2. Current vs. Target Dependency Matrix

| Category           | Package                    | Location                    | Current Version       | Target Version | Upgrade Action                    | Registry / Compatibility Notes                                     |
| :----------------- | :------------------------- | :-------------------------- | :-------------------- | :------------- | :-------------------------------- | :----------------------------------------------------------------- |
| **Core Framework** | `next`                     | `apps/web`, `apps/admin`    | `^15.2.1`             | `16.4.6`       | **Upgrade**                       | Verified stable `latest` on npm registry.                          |
| **Linting Plugin** | `@next/eslint-plugin-next` | root, `apps/*`              | _Not Installed_       | `16.4.6`       | **Install (New)**                 | Matches Next 16; natively supports ESLint 9 Flat Config.           |
| **UI Framework**   | `react`                    | `apps/web`, `apps/admin`    | `^19.0.0`             | `^19.0.0`      | **Retain**                        | Fully supported in Next 16 peer dependencies. No breaking changes. |
| **UI Framework**   | `react-dom`                | `apps/web`, `apps/admin`    | `^19.0.0`             | `^19.0.0`      | **Retain**                        | Fully supported in Next 16 peer dependencies.                      |
| **React Types**    | `@types/react`             | `apps/web`, `apps/admin`    | `^19.0.10`            | `^19.0.10`     | **Retain**                        | Aligned with React 19 typing.                                      |
| **React Types**    | `@types/react-dom`         | `apps/web`, `apps/admin`    | `^19.0.4`             | `^19.0.4`      | **Retain**                        | Aligned with React DOM 19 typing.                                  |
| **Language**       | `typescript`               | Root, packages, apps        | `^5.8.2`              | `^5.8.2`       | **Retain**                        | Next 16 requires `>=5.1.0`. 5.8.2 is modern & compatible.          |
| **Styling**        | `tailwindcss`              | `apps/web`, `apps/admin`    | `^4.0.9`              | `^4.0.9`       | **Retain**                        | Tailwind CSS v4 is supported natively in Next 16 Turbopack.        |
| **PostCSS Plugin** | `@tailwindcss/postcss`     | `apps/web`, `apps/admin`    | `^4.0.9`              | `^4.0.9`       | **Retain**                        | Modern PostCSS plugin integration for Tailwind v4.                 |
| **PostCSS**        | `postcss`                  | `apps/web`, `apps/admin`    | `^8.5.3`              | `^8.5.3`       | **Retain**                        | Matches Next.js internal PostCSS requirements.                     |
| **Linter Core**    | `eslint`                   | Root                        | `^9.21.0`             | `^9.21.0`      | **Retain**                        | ESLint 9 Flat Config supported by `eslint-config-next@16.4.6`.     |
| **State (Server)** | `@tanstack/react-query`    | `apps/web`, `apps/admin`    | `^5.66.0`             | `^5.66.0`      | **Retain**                        | Fully compatible with React 19 and Next 16.                        |
| **State (Client)** | `zustand`                  | `apps/web`, `apps/admin`    | `^5.0.3`              | `^5.0.3`       | **Retain**                        | Fully compatible with React 19.                                    |
| **Validation**     | `zod`                      | Root, packages, apps        | `^3.24.2`             | `^3.24.2`      | **Retain (Do not upgrade to v4)** | Avoid Zod v4 breaking API changes.                                 |
| **Forms**          | `react-hook-form`          | `apps/web`, `apps/admin`    | `^7.54.2`             | `^7.54.2`      | **Retain**                        | Compatible with React 19 and Zod v3 resolvers.                     |
| **UI Primitives**  | `@radix-ui/*` (all)        | `apps/web`, `apps/admin`    | `^1.1.x - 2.1.x`      | _Same_         | **Retain**                        | Fully operational with React 19.                                   |
| **Icons**          | `lucide-react`             | `apps/web`, `apps/admin`    | `^0.477.0`            | `^0.477.0`     | **Retain**                        | Stable icon library.                                               |
| **Toasts**         | `sonner`                   | `apps/web`, `apps/admin`    | `^2.0.1`              | `^2.0.1`       | **Retain**                        | Works cleanly in App Router.                                       |
| **Theme**          | `next-themes`              | `apps/web`, `apps/admin`    | `^0.4.4`              | `^0.4.4`       | **Retain**                        | Compatible with Next 16 App Router SSR.                            |
| **Charts**         | `recharts`                 | `apps/admin`                | `^3.11.0`             | `^3.11.0`      | **Retain**                        | Stable admin visualization library.                                |
| **Test Runner**    | `vitest`                   | Monorepo root & apps        | `^3.0.5`              | `^3.0.5`       | **Retain**                        | Works cleanly with jsdom and Vite plugin.                          |
| **Test Plugin**    | `@vitejs/plugin-react`     | `apps/web`, `apps/admin`    | `^4.3.4`              | `^4.3.4`       | **Retain (Dev/Test Only)**        | Required for Vitest JSX compilation.                               |
| **Backend Sync**   | `mongoose`                 | `apps/api` vs `apps/worker` | `8.10.1` vs `8.24.10` | `^8.24.10`     | **Harmonize**                     | Fixes monorepo driver drift identified in Task 01.                 |
| **Backend Sync**   | `bullmq`                   | `apps/api` vs `apps/worker` | `5.81.5` vs `5.41.6`  | `^5.81.5`      | **Harmonize**                     | Fixes queue protocol serialization mismatch.                       |

---

## 3. Analysis of Vite-Specific Dependencies in Admin

### Finding

In `apps/admin/package.json`:

- `"@vitejs/plugin-react": "^4.3.4"` is declared in `devDependencies`.
- `apps/admin/vitest.config.ts` imports and registers `react()` from `@vitejs/plugin-react`.
- `npm ls` reveals `@vitejs/plugin-react@4.7.0` pulls in `vite@7.3.8`, alongside `vitest@3.2.7` which pulls in `vite@7.3.8` and `vite-node@3.2.4`.

### Assessment & Clarification

1. **Application Runtime Isolation:** `@veyora/admin` is **not** a Vite web application. Its development and production lifecycles are governed entirely by Next.js (`next dev -p 3001`, `next build`, `next start -p 3001`). There are no `index.html`, Vite CLI scripts, or Vite dev server configurations.
2. **Purpose of Dependency:** `@vitejs/plugin-react` serves exclusively as the JSX/React transform plugin for Vitest unit test suites (`vitest.config.ts`).
3. **Recommendation:**
   - Retain `@vitejs/plugin-react` in `devDependencies` strictly for Vitest compatibility.
   - Do not allow Vite configuration or build artifacts into the Next.js runtime or build pipeline.
   - Vitest unit tests currently run and pass (16 tests in Admin, 65 tests in Web). Retaining this setup maintains zero friction for testing.

---

## 4. Required Configuration Changes

### A. Next.js Application Configurations (`apps/web/next.config.mjs` & `apps/admin/next.config.mjs`)

1. **Enable Standalone Docker Build Output:**

   ```js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: "standalone",
     transpilePackages: ["@veyora/types", "@veyora/utils", "@veyora/validators", "@veyora/config"],
     images: { ... },
   };
   export default nextConfig;
   ```

   _Rationale:_ Eliminates multi-gigabyte Docker container layers and allows deployment via `.next/standalone`.

2. **Turbopack Build Verification:**
   - Next.js 16 uses Turbopack as the default compiler for `next build`.
   - Ensure no Webpack-only plugins or custom loaders exist in `next.config.mjs`. (Both current configurations are already pure NextConfig objects with zero custom Webpack hooks).
   - If CI/CD environments experience memory pressure under Turbopack, prepare `--webpack` fallback flag.

### B. Monorepo ESLint Configuration (`eslint.config.mjs`)

1. Integrate `@next/eslint-plugin-next` rules into the root flat ESLint configuration:
   ```js
   import nextPlugin from "@next/eslint-plugin-next";

   export default tseslint.config(
     // ... existing rules
     {
       plugins: {
         "@next/next": nextPlugin,
       },
       rules: {
         ...nextPlugin.configs.recommended.rules,
         ...nextPlugin.configs["core-web-vitals"].rules,
       },
     }
   );
   ```

### C. Route Protection & Edge Routing (`proxy.ts` / `middleware.ts`)

1. Next.js 16 supports `proxy.ts` (alongside `middleware.ts`) to manage network boundaries.
2. Plan edge interception in `apps/admin/src/proxy.ts` (or `middleware.ts`) to check `refreshToken` / session cookies before HTML delivery.
3. Plan customer session restoration in `apps/web/src/proxy.ts` (or `middleware.ts`).
4. Ensure matcher paths explicitly exclude `/_next/static`, `/_next/image`, and static assets.

### D. App Router Error and Streaming Skeletons

1. Create `error.tsx` and `not-found.tsx` in `apps/admin/src/app/`.
2. Create `error.tsx` and `global-error.tsx` in `apps/web/src/app/`.
3. Create `loading.tsx` Suspense boundaries for streaming SSR across routes.

---

## 5. Potentially Breaking Changes & Mitigation

| Breaking Change                        | Next.js 16 Impact                                                            | Veyora Codebase Status                                                                                                                | Mitigation / Action Required                                                                        |
| :------------------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------- |
| **Strictly Asynchronous Request APIs** | `params`, `searchParams`, `cookies()`, and `headers()` must be awaited.      | **Low Risk.** Server pages (`category/[slug]`, `products/[slug]`) already use `params: Promise<{ slug: string }>` and `await params`. | Ensure all new server route parameters and header lookups are typed as `Promise` and awaited.       |
| **Turbopack Default Bundler**          | `next build` now defaults to Turbopack instead of Webpack.                   | **Low Risk.** Neither app has custom Webpack loaders or webpack plugins in `next.config.mjs`.                                         | Validate build with `npm run build:turbo`. Keep `--webpack` in reserve if edge-case bundling fails. |
| **Linter CLI Modernization**           | `next lint` CLI command is deprecated in favor of ESLint Flat Config.        | **Zero Risk.** Veyora already uses `"lint": "eslint ."` with ESLint 9 Flat Config.                                                    | Install `@next/eslint-plugin-next` and add to `eslint.config.mjs`.                                  |
| **Middleware Evolution (`proxy.ts`)**  | Next 16 adopts `proxy.ts` as the standard proxy/routing boundary convention. | **Low Risk.** Veyora currently has no middleware files.                                                                               | Write edge guards with Next 16 proxy specifications.                                                |
| **Node.js Minimum Engine**             | Node 18 dropped; requires `>=20.9.0`.                                        | **Zero Risk.** Veyora monorepo root enforces `node >=24.13.0`.                                                                        | Maintain Node 24 in Dockerfiles (`node:24-alpine`).                                                 |

---

## 6. Execution Order

```
[Phase 1: Verification & Pre-Checks]
  1.1 Verify git working branch is clean.
  1.2 Run baseline test suites (Vitest) & typechecking (tsc) — All passing.
  1.3 Create safety backup branch: git branch backup/pre-next16-migration.

[Phase 2: Configuration & Dependency Upgrade]
  2.1 Update package.json in apps/web and apps/admin:
      - "next": "16.4.6"
      - Add "@next/eslint-plugin-next": "16.4.6"
  2.2 Harmonize backend dependencies:
      - apps/worker/package.json: "bullmq": "^5.81.5"
      - apps/api/package.json: "mongoose": "^8.24.10"
  2.3 Execute clean dependency installation:
      npm install
  2.4 Validate package-lock.json and dependency graph.

[Phase 3: Configuration Alignment]
  3.1 Update apps/web/next.config.mjs: add output: "standalone".
  3.2 Update apps/admin/next.config.mjs: add output: "standalone".
  3.3 Update eslint.config.mjs: configure Next.js Core Web Vitals plugin rules.
  3.4 Update apps/admin/src/app/layout.tsx: configure next/font font optimization.

[Phase 4: Architecture & Error Handling Hardening]
  4.1 Implement error.tsx and global-error.tsx in apps/web/src/app.
  4.2 Implement error.tsx and not-found.tsx in apps/admin/src/app.
  4.3 Implement loading.tsx streaming skeletons in dynamic routes.
  4.4 Implement proxy.ts edge guards in web and admin.

[Phase 5: Validation & Regression Testing]
  5.1 Run full monorepo typecheck: npm run typecheck.
  5.2 Run unit test suites: npm run test.
  5.3 Run production build: npm run build (validates Turbopack compilation).
  5.4 Run end-to-end regression tests: npm run test:e2e.
  5.5 Verify Docker container standalone builds: docker compose build web admin.
```

---

## 7. Rollback Strategy

In the event of an unresolvable runtime regression, peer dependency lock, or Turbopack compilation failure:

### Step 1: Immediate Git Working Tree Reversion

If migration fails prior to deployment:

```bash
# Discard working tree changes and restore to pre-migration commit
git reset --hard HEAD
git clean -fd
```

Or switch back to the pre-migration safety branch:

```bash
git checkout backup/pre-next16-migration
```

### Step 2: Clean Re-Installation of Dependencies

```bash
# Purge build artifacts and locked node_modules
rm -rf node_modules apps/*/node_modules apps/*/.next apps/*/dist packages/*/node_modules packages/*/dist .turbo
npm ci
```

### Step 3: Fast Webpack Fallback (Without Downgrade)

If the issue is strictly Turbopack compilation of a specific package, apply the temporary Webpack flag in `package.json` scripts without rolling back Next.js:

```json
"scripts": {
  "dev": "next dev --webpack -p 3000",
  "build": "next build --webpack"
}
```

### Step 4: Production Container Rollback

If a regression is identified in staging/production post-deployment:

1. Re-tag the previously built Docker image in the container registry:
   ```bash
   docker tag veyora-web:15.2.1-stable veyora-web:latest
   docker tag veyora-admin:15.2.1-stable veyora-admin:latest
   ```
2. Trigger the automated rollback script documented in `docs/deployment/ROLLBACK_STRATEGY.md`.
3. Restart container services via `docker compose up -d web admin`.

---

## 8. Summary of Non-Applicable / Postponed Tasks

1. **Do Not Upgrade Zod to v4:** Zod v4 includes breaking changes to schema parsing methods. Zod `^3.24.2` is retained across all packages.
2. **Do Not Remove `@vitejs/plugin-react`:** It remains strictly isolated as a devDependency to power Vitest in both Web and Admin.
3. **No Code Modification Performed in Task 02:** Per requirements, no packages were installed or code modified during this planning task.
