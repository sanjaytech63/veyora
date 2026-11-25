# Veyora Architecture — Shared Tooling & Configuration Harmonization

## 1. Overview

The Veyora monorepo employs a centralized, harmonized tooling architecture designed to ensure consistent linting, strict TypeScript checks, and rapid cached builds while guaranteeing that both frontend applications (`@veyora/web` and `@veyora/admin`) and backend services (`@veyora/api` and `@veyora/worker`) remain independently buildable and deployable.

---

## 2. ESLint 9 Flat Configuration Architecture

### 2.1 Configuration Hub (`eslint.config.mjs`)

The repository uses modern **ESLint 9 Flat Config** format located at the root of the workspace. This configuration applies repository-wide standards while respecting framework boundaries:

1. **Global Ignores:**
   - Build outputs: `**/dist/**`, `**/.next/**`, `**/.turbo/**`
   - Dependencies: `**/node_modules/**`
   - Generated declarations & types: `**/next-env.d.ts`, `**/*.d.ts`
   - Test reports & hooks: `playwright-report/**`, `test-results/**`, `.husky/**`

2. **Core JavaScript & TypeScript Rules:**
   - Powered by `@eslint/js` and `typescript-eslint` (`tseslint.configs.recommended`).
   - Unused variables: Enforced via `@typescript-eslint/no-unused-vars` with leading underscore ignore patterns (`^_`).
   - Strict comparisons: Enforced via `eqeqeq: ["error", "always", { null: "ignore" }]`.
   - Code hygiene: `no-var: error`, `prefer-const: error`, `no-debugger: error`.
   - TypeScript comments: Enforces descriptions for `@ts-expect-error` and disallows unvetted `@ts-ignore`.

3. **Next.js 16 Plugin Integration (`@next/eslint-plugin-next`):**
   - Version: Exactly pinned and unified with Next.js `16.4.6`.
   - Scoped strictly to frontend projects:
     ```javascript
     {
       files: [
         "apps/web/**/*.{js,jsx,ts,tsx}",
         "apps/admin/**/*.{js,jsx,ts,tsx}",
       ],
       plugins: {
         "@next/next": nextPlugin,
       },
       rules: {
         ...nextPlugin.configs.recommended.rules,
         ...nextPlugin.configs["core-web-vitals"].rules,
       },
       settings: {
         next: {
           rootDir: ["apps/web/", "apps/admin/"],
         },
       },
     }
     ```
   - Core Web Vitals and recommended Next.js rules validate image optimization, script loading, typography, and page structure without bleeding into backend Node.js services.

---

## 3. TypeScript Configuration Hierarchy

Shared TypeScript configurations are maintained in `@veyora/config/tsconfig` and consumed across the monorepo:

```text
packages/config/tsconfig/base.json
       ├── node.json
       │     ├── packages/config/tsconfig.json
       │     ├── packages/types/tsconfig.json
       │     ├── packages/validators/tsconfig.json
       │     ├── packages/utils/tsconfig.json
       │     ├── apps/api/tsconfig.json
       │     └── apps/worker/tsconfig.json
       └── nextjs.json
             ├── apps/web/tsconfig.json
             └── apps/admin/tsconfig.json
```

### 3.1 Base Configuration (`base.json`)

- **Target & Lib:** `ES2022`
- **Strictness:** `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`, `noFallthroughCasesInSwitch: true`.
- **Quality Controls:** `noUnusedLocals: true`, `noUnusedParameters: true`, `forceConsistentCasingInFileNames: true`.
- **Declaration Generation:** `declaration: true`, `declarationMap: true` for packages.

### 3.2 Next.js Specialization (`nextjs.json`)

- Extends `base.json`.
- **Module Resolution:** `Bundler` with `module: "ESNext"`.
- **JSX:** `preserve` for Next.js App Router compiler.
- **Plugins:** Next.js language service plugin (`"name": "next"`).
- **Libraries:** Includes `DOM`, `DOM.Iterable`, `ES2022`.

### 3.3 Node.js Specialization (`node.json`)

- Extends `base.json`.
- **Module Resolution:** `NodeNext` with `module: "NodeNext"`.
- **Types:** Explicitly scoped to Node.js runtime (`"types": ["node"]`).

---

## 4. Turborepo Task Pipeline (`turbo.json`)

Turborepo orchestrates workspace builds and verification with fine-grained dependency tracking and caching:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "env": ["NEXT_PUBLIC_API_URL", "PORT"]
    },
    "lint": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "src/**", "test/**", "**/*.test.*", "**/*.spec.*"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Key Guarantees:

- **Upstream Dependencies (`^build`):** Internal packages (`@veyora/config`, `@veyora/types`, `@veyora/validators`, `@veyora/utils`) always build their declaration maps and artifacts before dependents compile.
- **Cache Isolation:** Next.js build cache (`!.next/cache/**`) is excluded from Turborepo hash outputs to prevent stale IPC or child-worker lock collisions.
- **Secret Protection:** Server secrets (`JWT_*`, `MONGODB_URI`, etc.) are never declared in `tasks.build.env`, preventing secret leaking into cache metadata.

---

## 5. Dependency Governance Policy

| Category            | Policy                                                                                                                                          |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**         | Pinned to exact version `16.4.6` across `apps/web`, `apps/admin`, and `@next/eslint-plugin-next`.                                               |
| **React**           | Unified on React 19 (`^19.0.0`) and React DOM 19.                                                                                               |
| **TypeScript**      | Unified on `^5.8.2` across root and all workspace packages.                                                                                     |
| **Tailwind CSS**    | Unified on Tailwind CSS v4 (`^4.0.9`) with `@tailwindcss/postcss`.                                                                              |
| **Validation**      | Pinned to Zod v3 (`^3.24.2`) in `@veyora/validators`. No premature Zod v4 migration.                                                            |
| **Backend Runtime** | Backend services retain `mongoose` (`^8.10.1` / `^8.24.10`) and `bullmq` (`^5.81.5` / `^5.41.6`). No unvetted framework upgrades.               |
| **Testing**         | Pinned to Vitest `^3.0.5` across all testing workspaces (`@veyora/web`, `@veyora/admin`, `@veyora/api`, `@veyora/validators`, `@veyora/utils`). |
