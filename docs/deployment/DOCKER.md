# Production Docker Architecture

## 1. Container Design Principles

All Veyora production container images follow strict security and efficiency principles:

1. **Multi-Stage Builds**: Distinct `builder` and `runner` stages ensure that compilers, devDependencies, and build caches never make it into production images.
2. **Non-Root Execution**: Every container executes under the unprivileged `USER node` (UID 1000) account, mitigating container breakout risks.
3. **Minimal Attack Surface**: Built on `node:24-alpine` for a tiny footprint (< 150MB compressed).
4. **Healthcheck Probes**: Native container health checks baked into each Dockerfile to interface with AWS ECS, Docker Compose, and Kubernetes orchestrators.
5. **No Baked Secrets**: Secrets and environment variables are injected at runtime via orchestration, never hardcoded in Dockerfiles.

---

## 2. Service Specifications

| Service    | Dockerfile Location                                                                     | Base Image       | Port   | Health Check              | Execution User |
| ---------- | --------------------------------------------------------------------------------------- | ---------------- | ------ | ------------------------- | -------------- |
| **API**    | [apps/api/Dockerfile](file:///C:/Users/Sanjay/Desktop/veyora/apps/api/Dockerfile)       | `node:24-alpine` | `4000` | `GET /health` (every 30s) | `node`         |
| **Worker** | [apps/worker/Dockerfile](file:///C:/Users/Sanjay/Desktop/veyora/apps/worker/Dockerfile) | `node:24-alpine` | N/A    | Node process check        | `node`         |
| **Web**    | [apps/web/Dockerfile](file:///C:/Users/Sanjay/Desktop/veyora/apps/web/Dockerfile)       | `node:24-alpine` | `3000` | `GET /` (every 30s)       | `node`         |
| **Admin**  | [apps/admin/Dockerfile](file:///C:/Users/Sanjay/Desktop/veyora/apps/admin/Dockerfile)   | `node:24-alpine` | `3001` | `GET /` (every 30s)       | `node`         |

---

## 3. Local Production Simulation

You can verify the entire multi-container production stack locally before cloud deployment:

```bash
# Build and run the entire stack in production mode
docker compose -f docker-compose.prod.yml up --build -d

# Check running container health status
docker compose -f docker-compose.prod.yml ps

# View live container logs
docker compose -f docker-compose.prod.yml logs -f api

# Tear down the stack and clean up volumes
docker compose -f docker-compose.prod.yml down -v
```

---

## 4. Manual Image Build Commands

To build an individual image manually:

```bash
# Core API
docker build -t veyora-api:latest -f apps/api/Dockerfile .

# Background Worker Suite
docker build -t veyora-worker:latest -f apps/worker/Dockerfile .

# Storefront Web
docker build -t veyora-web:latest -f apps/web/Dockerfile .

# Admin Console
docker build -t veyora-admin:latest -f apps/admin/Dockerfile .
```
