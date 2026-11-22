# Veyora Continuous Delivery & Containerization Architecture

## 1. Overview

Veyora applications are designed for cloud-native containerized deployments using multi-stage Node 24 Alpine Docker containers:

- **API Service**: Express REST + WebSocket Server (`apps/api/Dockerfile`)
- **Background Worker**: BullMQ Consumer Cluster (`apps/worker/Dockerfile`)
- **Storefront**: Next.js 15 Client & Server App (`apps/web/Dockerfile`)
- **Admin Console**: Next.js 15 Administrative Portal (`apps/admin/Dockerfile`)

---

## 2. Docker Architecture

All Dockerfiles follow production-grade multi-stage builds:

```
[Builder Stage: node:24-alpine]
   ↓
Installs libc6-compat
Copies monorepo manifests (package.json, turbo.json, packages)
Installs dependencies (npm ci)
Compiles shared packages and target application
   ↓
[Runner Stage: node:24-alpine]
   ↓
Copies compiled dist / .next output
Sets NODE_ENV=production
Executes under non-root 'node' user
Exposes required service ports (3000, 3001, 4000)
```

---

## 3. GitHub Actions Continuous Delivery Pipeline

The CD pipeline is codified in `.github/workflows/cd.yml`:

1. **Trigger**:
   - Automated run on push to `main` (only after all CI quality gates pass).
   - Manual triggering via `workflow_dispatch` with environment selection (`staging` or `production`).

2. **Quality Gates Prior to Image Building**:
   - `npm run typecheck`
   - `npm run lint:check`
   - `npm run format:check`
   - Unit & integration test execution

3. **Image Tagging Strategy**:
   - `latest`: Points to the newest release on `main`.
   - `sha-<git-commit-hash>`: Immutable release tag for zero-downtime rollbacks.

---

## 4. Required Secrets for Container Registry Integration

When connecting to AWS ECR, GitHub Container Registry (GHCR), or Docker Hub:

| Secret Name          | Purpose                                      | Example                                                  |
| :------------------- | :------------------------------------------- | :------------------------------------------------------- |
| `CONTAINER_REGISTRY` | Target container registry host               | `ghcr.io` or `123456789.dkr.ecr.us-east-1.amazonaws.com` |
| `REGISTRY_USERNAME`  | Registry authentication username             | GitHub actor or AWS IAM user                             |
| `REGISTRY_TOKEN`     | Registry write token / token secret          | Personal Access Token with package write scope           |
| `DEPLOY_WEBHOOK_URL` | Optional webhook triggering ECS/K8s redeploy | `https://api.render.com/deploy/...`                      |

---

## 5. Rollback Strategy

Because all images are tagged immutably with the commit SHA (`type=sha,format=long`), rollbacks can be performed instantly by updating the target service definition to the previous known good SHA image tag without rebuilding from source.
