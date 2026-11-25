# Veyora Development Guide — Monorepo Commands & Tooling

## 1. Quick Start

Ensure you have Node.js `>=24.13.0` and npm `>=11.21.0` installed:

```bash
# Install all dependencies across the monorepo
npm install

# Start development servers (API: 4000, Web: 3000, Admin: 3001)
npm run dev

# Or run with Turborepo task orchestration
npm run dev:turbo
```

---

## 2. Standardized Command Reference

All commands follow predictable npm workspace standards at root:

| Command                   | Action                    | Implementation Details                                                          |
| :------------------------ | :------------------------ | :------------------------------------------------------------------------------ |
| `npm run dev`             | Launch active dev servers | Concurrently runs API, Web, and Admin                                           |
| `npm run dev:full`        | Launch all services       | Concurrently runs API, Worker, Web, Admin                                       |
| `npm run dev:web`         | Run Storefront            | Starts `next dev -p 3000`                                                       |
| `npm run dev:admin`       | Run Admin Portal          | Starts `next dev -p 3001`                                                       |
| `npm run dev:api`         | Run Express API           | Starts `tsx watch src/server.ts`                                                |
| `npm run dev:worker`      | Run Background Worker     | Starts `tsx watch src/index.ts`                                                 |
| `npm run build`           | Monorepo production build | Builds shared packages, then API, Worker, Web, Admin                            |
| `npm run build:turbo`     | Cached production build   | Orchestrated via Turborepo (`turbo run build`)                                  |
| `npm run build:packages`  | Build internal libraries  | Builds `@veyora/config`, `@veyora/types`, `@veyora/validators`, `@veyora/utils` |
| `npm run build:web`       | Build Web storefront      | Builds upstream packages then executes `next build`                             |
| `npm run build:admin`     | Build Admin portal        | Builds upstream packages then executes `next build`                             |
| `npm run typecheck`       | Full monorepo typecheck   | Runs `tsc --noEmit` across all 8 workspaces                                     |
| `npm run typecheck:turbo` | Cached typecheck          | Runs `turbo run typecheck`                                                      |
| `npm run lint`            | Full monorepo lint        | Runs ESLint 9 Flat Config with Next.js & TS rules                               |
| `npm run lint:fix`        | Auto-fix lint violations  | Runs `eslint . --fix`                                                           |
| `npm run lint:turbo`      | Cached lint               | Runs `turbo run lint`                                                           |
| `npm run test`            | Run all test suites       | Executes Vitest in all workspaces with tests                                    |
| `npm run test:turbo`      | Cached test execution     | Runs `turbo run test`                                                           |
| `npm run test:e2e`        | Run Playwright E2E tests  | Executes `@playwright/test` across E2E specs                                    |
| `npm run format`          | Prettier formatting       | Formats workspace files via Prettier                                            |
| `npm run format:check`    | Format verification       | Verifies formatting without mutating files                                      |
| `npm run check`           | Full CI gate              | Runs typecheck, lint, format:check, test, and build                             |
| `npm run clean`           | Clean artifacts & caches  | Purges `.next`, `dist`, `.turbo`, and `node_modules`                            |

---

## 3. Workspace Port Allocations

| Service / App           | Workspace Name   | Default Port | Notes                             |
| :---------------------- | :--------------- | :----------- | :-------------------------------- |
| **Customer Storefront** | `@veyora/web`    | `3000`       | Next.js 16.4.6 Turbopack          |
| **Admin Portal**        | `@veyora/admin`  | `3001`       | Next.js 16.4.6 Turbopack          |
| **Express API**         | `@veyora/api`    | `4000`       | REST API, Swagger docs, Socket.IO |
| **Background Worker**   | `@veyora/worker` | —            | BullMQ queue worker               |
| **Redis**               | Infrastructure   | `6379`       | Docker / Local Redis instance     |
| **MongoDB**             | Infrastructure   | `27017`      | Local MongoDB Compass / Docker    |

---

## 4. Package Dependency Topology

When building packages manually or inspecting upstream dependencies:

```text
       ┌──────────────┐
       │@veyora/config│
       └──────┬───────┘
              │
       ┌──────▼──────┐
       │@veyora/types│
       └──────┬───────┘
              │
       ┌──────▼───────────┐
       │@veyora/validators│
       └──────┬───────────┘
              │
       ┌──────▼──────┐
       │@veyora/utils│
       └──────┬───────┘
              │
    ┌─────────┴─────────┬───────────────────┐
    ▼                   ▼                   ▼
@veyora/web       @veyora/admin       @veyora/api / worker
```
