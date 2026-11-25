# Task 18 — Monorepo Stabilization

**Date:** 2026-11-25  
**Scope:** all eight npm workspaces, E2E setup, CI/CD, Docker, Compose, and Terraform deployment configuration.

## Baseline

The working tree was clean on `feature/newsletter-subscription` before this task. The shared TypeScript base already enabled `strict`, `noImplicitAny`, `strictNullChecks`, and `noUncheckedIndexedAccess`.

| Check                      | Baseline result                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run typecheck`    | Passed across all eight workspaces.                                                                                                               |
| `npm.cmd run lint`         | 0 errors and 8 `no-explicit-any` warnings in four web/admin files.                                                                                |
| `npm.cmd run format:check` | Passed.                                                                                                                                           |
| `npm.cmd test`             | Passed outside the workspace sandbox: 721 tests across apps and packages. In-sandbox Vitest/esbuild could not traverse a runner parent directory. |
| `npm.cmd run build`        | Passed outside the workspace sandbox for shared packages and all four applications.                                                               |
| `npm.cmd run test:e2e`     | Initially 8/10. SSR used a pre-existing live API on port 4000 and saw missing data; login expected a toast heading the UI does not emit.          |

## Changes

### TypeScript and lint

- Replaced the homepage’s `any[]` with shared `Category[]` and `Product[]` types.
- Typed API fetch test options as `RequestInit` and used `Headers` normalization.
- Replaced the test-only role cast with the actual customer role string.
- Typed the `cookies()` test mock structurally instead of using `any` or a double assertion.
- The shared strict compiler options remain enabled; no rules were disabled or relaxed.

### Browser rendering and E2E

- Gave Playwright its own API port (`4010`), web/admin ports (`3300`/`3301`), and `.next-e2e` outputs. The mock API server cannot silently reuse a developer’s live API.
- Passed `INTERNAL_API_URL` and `NEXT_PUBLIC_API_URL` to both E2E apps so Node SSR and browser fetches reach the same mock service.
- Added explicit unauthenticated refresh/session responses to the mock API. Product SSR assertions now exercise the mock server itself.
- Changed the invalid-login assertion to verify the actual normalized error message and confirmed the 401 response.
- Kept the category menu and search query output stable through the first hydration render. Added Next.js’s `data-scroll-behavior` attribute where smooth scrolling is enabled.
- Disabled Next.js-generated agent-rule files and ignored the isolated build output in Git, ESLint, and Prettier.

### Workspace, CI, and release configuration

- Installed npm `11.21.0` explicitly in CI and Docker builders to match the root `packageManager` declaration; the base Node 24 image had npm `11.19.1`.
- Root development commands build the shared workspace packages before starting apps, so imports such as `@veyora/utils` resolve from a clean checkout.
- CD now runs typecheck, lint, formatting, tests, production build, and Playwright before deployment. OIDC permission is limited to the deploy job, dispatch deployments are restricted to `main`, and staging was removed because no staging ECS target exists in this repository.
- CD publishes commit-specific `sha-...` tags plus the mutable `latest` bootstrap alias used by the Terraform task definitions.
- Fixed the Terraform `local.services` reference, restricted the OIDC trust subject to this repository’s `main` ref, scoped ECR/ECS/PassRole actions, and added all runtime task roles to the PassRole allowlist.
- Terraform task definitions now provide the production CORS origins and use the worker schema’s `CONCURRENCY` variable.

### Docker, Compose, and environment configuration

- Added `.dockerignore` rules to keep local `.env` files, Git metadata, dependencies, generated builds, reports, and docs out of image build contexts.
- Docker builders install the declared npm version. Web/admin runtime commands invoke Next directly with Node instead of npm.
- Production Compose now requires MongoDB, Redis, JWT, cookie, CORS, Razorpay, and Cloudinary configuration rather than falling back to demo credentials. It provides the internal API URL to the web and admin server runtimes.
- Production API environment validation rejects the committed development/test fallback values for Razorpay and Cloudinary, in addition to the existing JWT, cookie, and wildcard CORS checks.
- Added matching Cloudinary keys to the Terraform Secrets Manager schema and ECS API task definition.

## Verification

Commands executed during the audit and remediation:

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd test
npm.cmd run build
npx.cmd playwright test e2e/login.spec.ts e2e/catalog-browsing.spec.ts --workers=1
$env:CI='true'; npm.cmd run test:e2e
docker compose -f docker-compose.yml config --quiet
docker compose -f docker-compose.prod.yml config --quiet  # temporary local-only values supplied to required variables
node -e "const fs=require('node:fs');const YAML=require('yaml');for(const f of ['.github/workflows/ci.yml','.github/workflows/cd.yml','docker-compose.yml','docker-compose.prod.yml','docker-compose.override.yml.example'])YAML.parse(fs.readFileSync(f,'utf8'))"
docker build -f apps/api/Dockerfile -t veyora-api:task18 .
docker build -f apps/worker/Dockerfile -t veyora-worker:task18 .
docker build -f apps/web/Dockerfile -t veyora-web:task18 .
docker build -f apps/admin/Dockerfile -t veyora-admin:task18 .
docker run --rm -v <terraform-dir>:/workspace -w /workspace hashicorp/terraform:1.9.8 fmt -check -recursive
docker run --rm -v <terraform-dir>:/workspace -w /workspace hashicorp/terraform:1.9.8 init -backend=false -input=false
docker run --rm -v <terraform-dir>:/workspace -w /workspace hashicorp/terraform:1.9.8 validate
```

The focused validator suite passed (48 tests). The full unit suite passed (721 tests), typecheck passed across all eight workspaces, and lint passed with no warnings. Prettier passed after formatting this report. Playwright passed 10/10 in CI mode. All four Docker images built successfully, including production builds of both Next.js apps. Both Compose files parsed, all workflow/Compose YAML parsed, and Terraform formatting and provider-backed validation passed.

After the follow-up development startup fix, `npm.cmd run dev:web` rebuilt the shared packages. Since port 3000 was already occupied, the web app was started on port 3310; Next compiled `/` and returned HTTP 200 without the missing `@veyora/utils` error.

Terraform validation initially caught unsupported ECS service `.arn` references in the deployer policy. These were replaced with scoped ECS service ARN strings derived from the cluster and service names. The provider lock file is committed to make subsequent Terraform initialization reproducible.

Docker’s `npm ci` output reported 9 lockfile advisories in the full workspace install (1 low, 5 moderate, 1 high, 2 critical). The production dependency audit identified direct `zod@3.25.76` as high severity for [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), an oversized constrained collection memory exhaustion issue. npm reports the available fix as Zod 4.6.7, a major-version upgrade. I left that dependency unchanged because it can require schema migration work; resolve it and run the validator/API test suites before production release.

## AWS and remaining external verification

Repository configuration expects the GitHub environment secret `AWS_DEPLOYMENT_ROLE_ARN` and optional variable `AWS_REGION` (defaults to `us-east-1`). Terraform defines the GitHub OIDC provider, role trust, ECR repositories, ECS services, and Secrets Manager schema. This environment cannot inspect GitHub repository/environment secrets or AWS account resources, so the deployed OIDC provider, role ARN, trust policy, ECR repositories, secret values, task definitions, and live service health remain unverified. No AWS operation or deployment was performed.

Production Compose requires `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD`, `MONGODB_URI`, `REDIS_PASSWORD`, `COOKIE_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, Razorpay credentials, and Cloudinary credentials. Secret values must be supplied outside the repository; MongoDB URI credentials need URI encoding when they contain reserved characters.

**Status:** local stabilization and validation are complete. Before production release, configure and verify the GitHub OIDC role and runtime secrets in AWS/GitHub, and review the outstanding dependency advisories. No infrastructure plan or apply was run.
