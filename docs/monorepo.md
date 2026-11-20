# Veyora Monorepo Guide

## 1. Monorepo Architecture

Veyora uses **npm workspaces** combined with **Turborepo** (v2) for orchestration, caching, and task execution.

### Advantages of This Setup:

- **Zero Package Manager Overhead**: Uses standard npm workspaces without requiring proprietary lockfiles.
- **Intelligent Task Graph**: Turborepo understands dependency chains (e.g. `@veyora/types` must build before `@veyora/api` can build).
- **Fast Rebuilds**: Turborepo caches task outputs (`dist/**`, `.next/**`) based on hash signatures of input files and environment configurations.
- **Parallel Execution**: Independent tasks run concurrently across available CPU cores.

---

## 2. Turborepo Pipeline Configuration (`turbo.json`)

The Turborepo pipeline coordinates lifecycle tasks across all workspaces:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Task Semantics

- `^build`: Ensures all topological upstream dependencies are built first.
- `inputs`: Recomputes cache hashes whenever source code or environment files change.
- `outputs`: Caches Next.js output directories and tsup distribution folders.
- `dev`: Configured as `cache: false` and `persistent: true` to support hot module reloading (HMR).

---

## 3. Package Management & Internal Dependencies

All shared packages are referenced using the `*` workspace protocol in `package.json`:

```json
{
  "dependencies": {
    "@veyora/config": "*",
    "@veyora/types": "*",
    "@veyora/utils": "*",
    "@veyora/validators": "*"
  }
}
```

### Adding a New Shared Package

1. Create directory `packages/<package-name>`.
2. Add `package.json` with `"name": "@veyora/<package-name>"` and `"private": true`.
3. Add `tsconfig.json` extending `@veyora/config/tsconfig/node.json`.
4. Configure build scripts with `tsup`.
5. Run `npm install` from the root.

### Adding a New Application

1. Create directory `apps/<app-name>`.
2. Add `package.json` with `"name": "@veyora/<app-name>"` and `"private": true`.
3. Add required shared package dependencies in `dependencies`.
4. Configure application scripts (`dev`, `build`, `typecheck`, `lint`).
5. Run `npm install` from the root.

---

## 4. Filtering and Targeted Execution

Turborepo supports granular filtering flags to run tasks against single workspaces or subset trees:

```bash
# Build only web storefront and its dependencies
npm run build -- --filter=@veyora/web

# Typecheck only the API service
npm run typecheck -- --filter=@veyora/api

# Run dev mode for web and admin
npx turbo run dev --filter=@veyora/web --filter=@veyora/admin
```
