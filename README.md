# Veyora Monorepo

> Production-ready, modular, and scalable e-commerce platform monorepo foundation.

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-v2-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/repo)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8_Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.41-FF4081?logo=redis&logoColor=white)](https://docs.bullmq.io/)

---

## 1. Overview

**Veyora** is an enterprise-grade e-commerce platform built as a high-performance monorepo using **npm workspaces**, **Turborepo**, and **TypeScript Strict Mode**.

This repository contains the Phase A foundational infrastructure, workspace layout, core shared libraries, application skeletons, configuration, and developer tooling.

---

## 2. Monorepo Structure

```
veyora/
├── apps/
│   ├── web/              # Next.js 15 customer storefront (App Router, Tailwind v4, shadcn/ui)
│   ├── admin/            # Next.js 15 administrative portal (App Router, Tailwind v4, shadcn/ui)
│   ├── api/              # Modular Express API (Node.js 24, TypeScript strict, graceful shutdown)
│   └── worker/           # BullMQ background worker (Node.js 24, Redis queue lifecycle)
├── packages/
│   ├── types/            # Shared TypeScript definitions & domain interfaces
│   ├── validators/       # Zod validation schemas (runtime & env validation)
│   ├── utils/            # Structured logging, custom errors, string utilities
│   └── config/           # Base tsconfigs, ESLint configs, system constants
├── docs/                 # In-depth architectural & operational documentation
├── docker-compose.yml    # MongoDB & Redis container definitions with persistent volumes & healthchecks
├── turbo.json            # Turborepo task graph and pipeline configuration
└── package.json          # Root scripts and workspace definitions
```

---

## 3. Tech Stack

| Component               | Technology         | Version          | Purpose                                                   |
| :---------------------- | :----------------- | :--------------- | :-------------------------------------------------------- |
| **Runtime**             | Node.js            | `>=24.13.0`      | High-performance JavaScript/TypeScript runtime            |
| **Workspace Manager**   | npm Workspaces     | `>=11.21.0`      | Native monorepo dependency management                     |
| **Orchestrator**        | Turborepo          | `^2.4.4`         | High-speed build system and task pipeline caching         |
| **Language**            | TypeScript         | `^5.8.2`         | Strict typing across all applications and shared packages |
| **Customer Storefront** | Next.js App Router | `^15.2.1`        | High-performance server-rendered shopping experience      |
| **Admin Portal**        | Next.js App Router | `^15.2.1`        | Operations, catalog, and management console               |
| **Core API**            | Express            | `^4.21.2`        | Modular REST API with structured controllers & middleware |
| **Background Queue**    | BullMQ + Redis     | BullMQ `^5.41.6` | Distributed job queuing, retries, and async workers       |
| **Database**            | MongoDB            | `7.0`            | Document data store for core business persistence         |
| **Styling**             | Tailwind CSS v4    | `^4.0.9`         | Next-generation CSS framework with CSS variables          |
| **UI Components**       | shadcn/ui          | Standard CVA     | Composable, accessible, themed UI primitives              |
| **Validation**          | Zod                | `^3.24.2`        | Type-safe schema validation for inputs & environment      |

---

## 4. Quick Start

### Prerequisites

- **Node.js**: `v24.x` (LTS recommended)
- **npm**: `v10.x` or later
- **Docker & Docker Compose**: (Optional for local databases, required for production simulation)

### Installation

```bash
# Clone repository and enter directory
cd veyora

# Install dependencies across all workspaces
npm install
```

### Starting Infrastructure

Spin up local MongoDB and Redis instances with persistent volumes:

```bash
docker compose up -d
```

Verify container health:

```bash
docker compose ps
```

### Running Applications

Run all services simultaneously with Turborepo:

```bash
npm run dev
```

Or run individual applications independently:

```bash
# Customer Storefront (http://localhost:3000)
npm run dev:web

# Admin Portal (http://localhost:3001)
npm run dev:admin

# Express API (http://localhost:4000)
npm run dev:api

# BullMQ Worker
npm run dev:worker
```

---

## 5. Available Scripts

The root `package.json` provides unified commands orchestrating all workspaces:

| Command                | Description                                                           |
| :--------------------- | :-------------------------------------------------------------------- |
| `npm run dev`          | Runs all apps and watch-mode packages concurrently via Turborepo      |
| `npm run dev:web`      | Starts the customer storefront independently (`apps/web`)             |
| `npm run dev:admin`    | Starts the administration portal independently (`apps/admin`)         |
| `npm run dev:api`      | Starts the Express API server independently (`apps/api`)              |
| `npm run dev:worker`   | Starts the BullMQ worker daemon independently (`apps/worker`)         |
| `npm run build`        | Builds all packages and applications with cached task execution       |
| `npm run build:web`    | Builds only the storefront application                                |
| `npm run build:admin`  | Builds only the administration application                            |
| `npm run build:api`    | Builds only the Express API service                                   |
| `npm run build:worker` | Builds only the background worker                                     |
| `npm run lint`         | Lints all workspaces using ESLint 9                                   |
| `npm run typecheck`    | Validates TypeScript types across the monorepo in strict mode         |
| `npm run format`       | Formats all source files with Prettier                                |
| `npm run format:check` | Verifies code formatting across the repository                        |
| `npm run test`         | Executes workspace test suites                                        |
| `npm run clean`        | Cleans build artifacts (`dist`, `.next`, `.turbo`) and `node_modules` |

---

## 6. Documentation Index

Comprehensive guides are available in the [`docs/`](file:///c:/Users/Sanjay/Desktop/veyora/docs) directory:

- [Architecture Overview](file:///c:/Users/Sanjay/Desktop/veyora/docs/architecture.md)
- [Monorepo Guide](file:///c:/Users/Sanjay/Desktop/veyora/docs/monorepo.md)
- [Local Development Setup](file:///c:/Users/Sanjay/Desktop/veyora/docs/local-development.md)
- [Git Workflow & Conventions](file:///c:/Users/Sanjay/Desktop/veyora/docs/git-workflow.md)
- [Environment Configuration](file:///c:/Users/Sanjay/Desktop/veyora/docs/environment.md)

---

## 7. License

Private & Proprietary — Veyora Platform.
