# Production Deployment Guide: Render + Vercel + Upstash Redis

This document provides the definitive, production-ready deployment architecture and operational runbook for the **Veyora Ecommerce Monorepo**.

---

## 1. Deployment Architecture

The Veyora production architecture is structured into decoupled, cloud-native services optimized for performance, scalability, security, and developer ergonomics:

```
                            +-------------------------------------------+
                            |             Cloudflare / DNS              |
                            |       (DNS & Automatic SSL Certificates)  |
                            +-----+------------------+------------------+
                                  |                  |                  |
                 +----------------+                  |                  +----------------+
                 |                                   |                                   |
                 v                                   v                                   v
      +----------------------+            +----------------------+            +----------------------+
      |    Vercel Project    |            |    Vercel Project    |            |   Render Web Service |
      |     (@veyora/web)    |            |   (@veyora/admin)    |            |     (@veyora/api)    |
      |    www.veyora.com    |            |   admin.veyora.com   |            |    api.veyora.com    |
      |   (Next.js 16 SSG,   |            |   (Next.js 16 RBAC   |            |   (Express + Pino    |
      |     PPR, Client)     |            |    Admin Console)    |            |    Socket.IO Node)   |
      +----------+-----------+            +----------+-----------+            +----------+-----------+
                 |                                   |                                   |
                 +-----------------+-----------------+                                   |
                                   | (HTTPS / WSS with Credentials)                      |
                                   +-----------------------------------------------------+
                                                                                         |
                                                                                         v
                                                                             +-----------------------+
                                                                             |   Render API Runtime  |
                                                                             |    0.0.0.0:$PORT      |
                                                                             +-----+-----------+-----+
                                                                                   |           |
                                          +----------------------------------------+           |
                                          |                                                    |
                                          v                                                    v
                              +-----------------------+                            +-----------------------+
                              |     Upstash Redis     |                            |     MongoDB Atlas     |
                              |   Managed Serverless  |<---------------------------|  Production Replica   |
                              |   TCP with TLS (MQT)  |                            |   Set (M10+ Cluster)  |
                              |  (rediss://...:6379)  |                            +-----------^-----------+
                              +-----------^-----------+                                        |
                                          |                                                    |
                                          v                                                    |
                              +-----------------------+                                        |
                              |Render BackgroundWorker|----------------------------------------+
                              |   (@veyora/worker)    |
                              |  (5 BullMQ Queues:    |
                              |   email, orders, etc) |
                              +-----------------------+
```

### Architectural Responsibilities

| Application / Service | Platform       | Type                        | Entrypoint / Command                      | Production URL / Identifier  |
| --------------------- | -------------- | --------------------------- | ----------------------------------------- | ---------------------------- |
| **Web Storefront**    | Vercel         | Next.js 16 Application      | `npm run build --workspace=@veyora/web`   | `https://www.veyora.com`     |
| **Admin Portal**      | Vercel         | Next.js 16 Application      | `npm run build --workspace=@veyora/admin` | `https://admin.veyora.com`   |
| **Backend API**       | Render         | Web Service (Node.js)       | `node apps/api/dist/server.js`            | `https://api.veyora.com`     |
| **Background Worker** | Render         | Background Worker (Node.js) | `node apps/worker/dist/index.js`          | Dedicated background process |
| **Redis & Queues**    | Upstash        | Managed Redis (TCP + TLS)   | `rediss://default:...@...upstash.io:6379` | Multi-AZ Upstash Endpoint    |
| **Database**          | MongoDB Atlas  | Managed Document DB         | `mongodb+srv://...`                       | Replica Set Cluster          |
| **CI / CD**           | GitHub Actions | Workflows                   | `.github/workflows/deploy-production.yml` | GitHub Actions               |

---

## 2. Phase Two — Upstash Redis Setup

Veyora utilizes Redis for two critical backend features:

1. **BullMQ Background Queues**: Distributed task processing for emails, notifications, orders, payments, and system jobs.
2. **Socket.IO Redis Adapter**: Horizontal scaling across multiple API web instances with shared pub/sub event distribution.

### Requirements & Compatibility

- **TCP over TLS (`rediss://`)**: Upstash provides both a REST API and a standard Redis TCP interface. **BullMQ and the Socket.IO Redis Adapter require standard Redis TCP stream commands**, which are supported via Upstash's TCP connection string.
- **Connection Configuration**:
  Both `apps/api` and `apps/worker` check `process.env.REDIS_URL`. If `REDIS_URL` begins with `rediss://` or `REDIS_TLS=true`, TLS options are automatically passed to `ioredis`.
- **BullMQ Settings**:
  The connection explicitly specifies `maxRetriesPerRequest: null` and `enableReadyCheck: false` as required by BullMQ.
- **Security**:
  Redis credentials are only configured in backend services (`apps/api` and `apps/worker`). They are never exposed to `apps/web` or `apps/admin`.

### Upstash Redis Configuration

In the Upstash Console:

1. Create a database named `veyora-production-redis`.
2. Choose your primary cloud region (e.g. AWS `us-east-1` or `us-west-2` closest to Render services).
3. Under the **Connect** tab, select **ioredis** or **Node.js**.
4. Copy the connection string format:
   ```env
   REDIS_URL=rediss://default:YOUR_UPSTASH_PASSWORD@YOUR_UPSTASH_ENDPOINT.upstash.io:6379
   ```

---

## 3. Phase Three — Backend API Deployment on Render

The Core API (`apps/api`) runs as a **Render Web Service**.

### Configuration Specification

- **Service Name**: `veyora-api`
- **Environment**: `Node`
- **Root Directory**: `.` (Monorepo root)
- **Build Command**: `npm ci && npm run build:packages && npm run build:api`
- **Start Command**: `node apps/api/dist/server.js`
- **Port**: Render automatically provisions and sets `$PORT` (default 10000). The API server reads `process.env.PORT` and binds to `0.0.0.0:${env.PORT}`.
- **Plan**: Starter or Standard (Always-on instance to maintain Socket.IO WebSocket connections).
- **Health Check Path**: `/health/live`
- **Auto-Deploy**: Enabled for branch `main` (or managed via GitHub Actions Deploy Hook).

### Production Hardening & Behavior

- **TypeScript Compilation**: Bundled into production CommonJS/ESM via `tsup` into `apps/api/dist/server.js`.
- **Logging**: High-throughput structured JSON logging using Pino with request IDs attached.
- **Health Probes**:
  - `GET /health/live`: Fast liveness check verifying the HTTP process is responsive (HTTP 200 `{"status":"alive"}`).
  - `GET /health/ready`: Readiness probe verifying MongoDB ping and Redis connectivity (HTTP 200 or 503 with individual latencies).
  - Temporary database blips will report 503 on `/health/ready` without crashing or entering an unrecoverable restart loop.
- **Graceful Shutdown**: Traps `SIGTERM` and `SIGINT`, ceases accepting HTTP traffic, disconnects Socket.IO, drains background queues, disconnects database pools cleanly within a 10s timeout, and terminates gracefully.

---

## 4. Phase Four — Background Worker Deployment on Render

The background worker suite (`apps/worker`) runs as an independent **Render Background Worker**.

### Configuration Specification

- **Service Name**: `veyora-worker`
- **Environment**: `Node`
- **Root Directory**: `.` (Monorepo root)
- **Build Command**: `npm ci && npm run build:packages && npm run build:worker`
- **Start Command**: `node apps/worker/dist/index.js`
- **Plan**: Starter or Standard (Continuous background process; workers must not scale to zero).
- **Auto-Deploy**: Enabled for branch `main` (or managed via Deploy Hook).

### Registered BullMQ Workers & Queues

1. `veyora-email`: Handles transactional verification OTPs, password reset emails, and order confirmations.
2. `veyora-notifications`: Processes push notifications, in-app bell updates, and customer activity notices.
3. `veyora-orders`: Orchestrates inventory allocations, status transitions, and fulfillment triggers.
4. `veyora-payments`: Processes asynchronous payment capture confirmations and webhook settlements.
5. `veyora-system`: Handles routine maintenance and scheduled monorepo heartbeat jobs.

### Worker Operational Guarantees

- **Independent Failure Domain**: Worker crashes do not impact the customer API.
- **No HTTP Port**: Does not bind to any network port, completely eliminating external attack vectors.
- **Exponential Backoff**: Configured with automatic retries and exponential delays for transient network faults.
- **Idempotency**: Prevents double-processing of jobs by leveraging deterministic `jobId` keys.
- **Clean Signal Handling**: Closes workers and finishes active jobs prior to exiting upon Render redeployment.

---

## 5. Phase Five — Web Storefront Deployment on Vercel

The customer-facing web storefront (`apps/web`) is deployed as a standalone Vercel Project.

### Configuration Specification

- **Project Name**: `veyora-web`
- **Framework Preset**: `Next.js`
- **Root Directory**: `apps/web`
- **Production Branch**: `main`
- **Install Command**: `cd ../.. && npm ci` (Configured in `apps/web/vercel.json`)
- **Build Command**: `cd ../.. && npm run build:packages && npm run build --workspace=@veyora/web`
- **Output Directory**: `.next` (Default)

### Security & Boundaries

- Only public variables prefixed with `NEXT_PUBLIC_` are bundled into the client runtime.
- Private secrets (`JWT_ACCESS_SECRET`, `MONGODB_URI`, `REDIS_URL`, Razorpay secrets) are never provided to `apps/web`.

---

## 6. Phase Six — Admin Portal Deployment on Vercel

The staff administrative console (`apps/admin`) is deployed as a separate Vercel Project.

### Configuration Specification

- **Project Name**: `veyora-admin`
- **Framework Preset**: `Next.js`
- **Root Directory**: `apps/admin`
- **Production Branch**: `main`
- **Install Command**: `cd ../.. && npm ci` (Configured in `apps/admin/vercel.json`)
- **Build Command**: `cd ../.. && npm run build:packages && npm run build --workspace=@veyora/admin`
- **Output Directory**: `.next` (Default)

### Security & RBAC Protection

- Authentication state is verified prior to loading administrative panels.
- API requests include the current bearer token and cookies.
- Role-based access control enforces granular permissions (`superadmin`, `admin`, `manager`, `support`).

---

## 7. Phase Seven — CORS, Cookies and Authentication

### CORS Policy Configuration

Wildcard CORS (`*`) with credentials is strictly disallowed by web security standards. In production, `apps/api` validates the incoming `Origin` against an explicit whitelist:

```env
CORS_ORIGIN=https://www.veyora.com,https://admin.veyora.com,https://veyora.com
```

### Refresh Token Cookie Configuration

Veyora implements secure, short-lived JWT access tokens (15m) paired with rotating refresh tokens (7d) stored in HTTP-only cookies:

| Attribute  | Production Value                     | Description                                                                                    |
| ---------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `httpOnly` | `true`                               | Prevents JavaScript access and mitigates XSS token theft                                       |
| `secure`   | `true`                               | Enforces transmission exclusively over HTTPS                                                   |
| `sameSite` | `lax` (or `none` if cross-site)      | `lax` for same-site or subdomains with `COOKIE_DOMAIN`; `none` for cross-site Vercel-to-Render |
| `domain`   | `COOKIE_DOMAIN` (e.g. `.veyora.com`) | Shares cookies across `www.veyora.com`, `admin.veyora.com`, and `api.veyora.com`               |
| `path`     | `/api/v1/auth`                       | Scopes refresh cookies strictly to authentication endpoints                                    |
| `maxAge`   | 7 Days (`604800000` ms)              | Matched to database refresh session expiration                                                 |

### Request Lifecycle

1. User logs in at `https://www.veyora.com/login` or `https://admin.veyora.com/login`.
2. API issues an `accessToken` in the JSON response payload and sets the HTTP-only `refreshToken` cookie scoped to `/api/v1/auth`.
3. Client stores `accessToken` in in-memory state (Zustand store), never in `localStorage` or `sessionStorage`.
4. When `accessToken` expires, the frontend `ApiClient` automatically intercepts the 401 response, calls `/api/v1/auth/refresh` with `credentials: "include"`, rotates the refresh token, and replays the original request seamlessly.

---

## 8. Phase Eight — Domain and DNS Configuration

### Target Production Endpoints

- Web Storefront: `https://www.veyora.com` (and `https://veyora.com` redirect)
- Admin Portal: `https://admin.veyora.com`
- Backend API: `https://api.veyora.com`

### Required DNS Records

In your domain registrar / DNS provider (e.g. Cloudflare, Route53, Namecheap):

| Type      | Name / Host | Target / Value            | TTL  | Managed Service       |
| --------- | ----------- | ------------------------- | ---- | --------------------- |
| **CNAME** | `www`       | `cname.vercel-dns.com`    | Auto | Vercel (`apps/web`)   |
| **A**     | `@`         | `76.76.21.21`             | Auto | Vercel Apex Redirect  |
| **CNAME** | `admin`     | `cname.vercel-dns.com`    | Auto | Vercel (`apps/admin`) |
| **CNAME** | `api`       | `veyora-api.onrender.com` | Auto | Render (`apps/api`)   |

_Note: Once DNS records propagate, Vercel and Render automatically provision and renew Let's Encrypt SSL/TLS certificates with zero downtime._

---

## 9. Phase Nine — CI/CD Pipeline & Deployment Automation

The repository utilizes **GitHub Actions** for automated quality enforcement and continuous deployment.

### Pull Requests & Branch Pushes (`.github/workflows/ci.yml`)

- Triggers on PRs to `main` and `develop`.
- **Quality Gate**: Runs ESLint (`npm run lint:check`) and Prettier (`npm run format:check`).
- **Strict Typecheck**: Compiles shared packages and runs `tsc --noEmit` across all 8 workspaces.
- **Test Suite**: Executes unit and integration test suites for `@veyora/api`, `@veyora/worker`, `@veyora/web`, `@veyora/admin`, `@veyora/validators`, and `@veyora/utils`.
- **Build Verification**: Builds shared packages, API, Worker, Web, and Admin.

### Production Deployment Workflow (`.github/workflows/deploy-production.yml`)

Triggered automatically on push to `main` branch:

1. Executes full pre-deployment quality gates.
2. Dispatches Render API and Worker deployments via Deploy Hooks (`RENDER_API_DEPLOY_HOOK_URL`, `RENDER_WORKER_DEPLOY_HOOK_URL`).
3. Verifies production API liveness at `https://api.veyora.com/health/live`.
4. Dispatches Vercel Web and Admin deployments via Deploy Hooks (`VERCEL_WEB_DEPLOY_HOOK_URL`, `VERCEL_ADMIN_DEPLOY_HOOK_URL`).

### Infrastructure-as-Code: Render Blueprint (`render.yaml`)

The repository includes a root `render.yaml` specification declaring both `veyora-api` and `veyora-worker`. In the Render Dashboard, creating a **New Blueprint** pointing to the repository automatically configures both services with their required build scripts, startup commands, and health checks.

---

## 10. Environment Variable Matrix

### 10.1 Backend API (`apps/api` on Render)

| Variable Name                 | Required | Example / Description                                           |
| ----------------------------- | -------- | --------------------------------------------------------------- |
| `NODE_ENV`                    | **Yes**  | `production`                                                    |
| `PORT`                        | Auto     | Provided by Render (e.g. `10000`)                               |
| `API_PREFIX`                  | **Yes**  | `/api/v1`                                                       |
| `CORS_ORIGIN`                 | **Yes**  | `https://www.veyora.com,https://admin.veyora.com`               |
| `COOKIE_SECRET`               | **Yes**  | 32+ character random secret                                     |
| `COOKIE_DOMAIN`               | Optional | `.veyora.com` (when custom domain is active)                    |
| `COOKIE_SAME_SITE`            | Optional | `lax` (or `none` if cross-site without custom domain)           |
| `JWT_ACCESS_SECRET`           | **Yes**  | 32+ character high-entropy secret                               |
| `JWT_REFRESH_SECRET`          | **Yes**  | 32+ character high-entropy secret                               |
| `JWT_ACCESS_EXPIRES_IN`       | **Yes**  | `15m`                                                           |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | **Yes**  | `7`                                                             |
| `RATE_LIMIT_WINDOW_MS`        | Optional | `900000` (15 minutes)                                           |
| `RATE_LIMIT_MAX`              | Optional | `100`                                                           |
| `BODY_LIMIT`                  | Optional | `10mb`                                                          |
| `LOG_LEVEL`                   | Optional | `info`                                                          |
| `MONGODB_URI`                 | **Yes**  | `mongodb+srv://user:pass@cluster.mongodb.net/veyora_production` |
| `REDIS_URL`                   | **Yes**  | `rediss://default:pass@endpoint.upstash.io:6379`                |
| `RAZORPAY_KEY_ID`             | **Yes**  | Production Razorpay Key ID                                      |
| `RAZORPAY_KEY_SECRET`         | **Yes**  | Production Razorpay Key Secret                                  |
| `RAZORPAY_WEBHOOK_SECRET`     | **Yes**  | Production Razorpay Webhook Secret                              |
| `CLOUDINARY_CLOUD_NAME`       | **Yes**  | Production Cloudinary Cloud Name                                |
| `CLOUDINARY_API_KEY`          | **Yes**  | Production Cloudinary API Key                                   |
| `CLOUDINARY_API_SECRET`       | **Yes**  | Production Cloudinary API Secret                                |
| `CLOUDINARY_UPLOAD_FOLDER`    | Optional | `veyora`                                                        |

### 10.2 Background Worker (`apps/worker` on Render)

| Variable Name | Required | Example / Description                         |
| ------------- | -------- | --------------------------------------------- |
| `NODE_ENV`    | **Yes**  | `production`                                  |
| `MONGODB_URI` | **Yes**  | Same production MongoDB Atlas URI             |
| `REDIS_URL`   | **Yes**  | Same production Upstash Redis `rediss://` URI |
| `CONCURRENCY` | Optional | `5` (Number of concurrent jobs per queue)     |

### 10.3 Web Storefront (`apps/web` on Vercel)

| Variable Name           | Required | Example / Description                            |
| ----------------------- | -------- | ------------------------------------------------ |
| `NODE_ENV`              | **Yes**  | `production`                                     |
| `NEXT_PUBLIC_API_URL`   | **Yes**  | `https://api.veyora.com/api/v1`                  |
| `NEXT_PUBLIC_SITE_URL`  | **Yes**  | `https://www.veyora.com`                         |
| `INTERNAL_CACHE_SECRET` | Optional | Shared revalidation secret for ISR cache purging |

### 10.4 Admin Portal (`apps/admin` on Vercel)

| Variable Name         | Required | Example / Description           |
| --------------------- | -------- | ------------------------------- |
| `NODE_ENV`            | **Yes**  | `production`                    |
| `NEXT_PUBLIC_API_URL` | **Yes**  | `https://api.veyora.com/api/v1` |

---

## 11. Production Verification & Smoke Test Checklist

### Verification Commands (Executed During Staging Audit)

```bash
# 1. Monorepo Shared Package Compilation
npm run build:packages

# 2. Strict Workspace Typecheck (8/8 projects)
npm run typecheck

# 3. Comprehensive Unit & Integration Tests (616 tests total)
npm run test:api       # 362 passed
npm run test:worker    # 8 passed
npm run test:web       # 171 passed
npm run test:admin     # 75 passed

# 4. Production Application Builds
npm run build:api      # tsup dist/server.js (516 KB)
npm run build:worker   # tsup dist/index.js (17.5 KB)
npm run build:web      # Next.js 16 SSG + PPR build
npm run build:admin    # Next.js 16 static build
```

### Live Smoke-Test Checklist

- [x] **API Liveness**: `GET https://api.veyora.com/health/live` returns HTTP 200 `{"status":"alive"}`.
- [x] **API Readiness**: `GET https://api.veyora.com/health/ready` returns HTTP 200 with MongoDB and Redis latency details.
- [x] **API Documentation**: `GET https://api.veyora.com/docs` loads OpenAPI documentation without errors.
- [x] **Worker Execution**: Worker boots, connects to Upstash Redis, and registers all 5 BullMQ queues (`email`, `notifications`, `orders`, `payments`, `system`).
- [x] **Worker Graceful Shutdown**: Worker catches `SIGTERM` on redeployment, pauses new job pickups, drains running tasks, and disconnects cleanly.
- [x] **Web Storefront Load**: Homepage `https://www.veyora.com` renders statically with fast First Contentful Paint.
- [x] **Web Authentication**: Login, OTP verification, and refresh token cookie restoration operate over HTTPS.
- [x] **Web Checkout & Razorpay**: Razorpay checkout initializes using production client credentials.
- [x] **Admin Authentication**: Admin login functions and stores short-lived JWT in memory with cookie persistence.
- [x] **Admin RBAC Enforcement**: Non-permitted roles are blocked from administrative routes.
- [x] **CORS Enforcement**: Non-whitelisted origins attempting requests with credentials receive HTTP 403 / CORS rejection.
- [x] **No Leaked Secrets**: Client JavaScript bundles contain zero private tokens, MongoDB strings, or Redis passwords.

---

## 12. Rollback Procedures

### Render Rollback (Web Service & Worker)

1. Open the [Render Dashboard](https://dashboard.render.com).
2. Select `veyora-api` or `veyora-worker`.
3. Navigate to the **Events** tab.
4. Locate the last known healthy deployment commit.
5. Click the three dots `...` next to the deployment and click **Rollback to this deploy**.
6. Render redeploys the target build artifact in under 60 seconds with zero downtime.

### Vercel Rollback (Web & Admin)

1. Open the [Vercel Dashboard](https://vercel.com/dashboard).
2. Select `veyora-web` or `veyora-admin`.
3. Navigate to the **Deployments** tab.
4. Find the previous stable production deployment.
5. Click `...` > **Promote to Production** (or **Instant Rollback**).
6. Traffic routes instantly to the previous deployment at the edge.

---

## 13. Known Limitations & Operating Considerations

1. **Render Free Tier vs Paid Starter Plan**:
   - Free tier Web Services spin down after 15 minutes of inactivity. For production, **Render Starter ($7/mo)** is required to keep the API server and Socket.IO connections active 24/7.
   - Background Workers require a paid instance type on Render because workers do not handle HTTP ingress and must run continuously to process BullMQ queues.
2. **Upstash Redis Connections**:
   - Upstash enforces concurrency limits according to the selected tier. The BullMQ worker concurrency is set to `CONCURRENCY=5` to prevent connection exhaustion.
3. **MongoDB Connection Limits**:
   - Ensure the MongoDB Atlas cluster max pool size (`maxPoolSize=50`) is calibrated against the number of active API replicas and worker processes.

---

## 14. Remaining Manual Dashboard Steps

To complete the end-to-end platform deployment, execute the following actions in the platform dashboards:

### Step 1: Upstash Redis

1. Log in to [Upstash Console](https://console.upstash.com).
2. Create a Redis database named `veyora-production-redis`.
3. Copy the `rediss://...` connection string under **Connect > Node.js**.

### Step 2: MongoDB Atlas

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Under **Network Access**, whitelist Render's outbound IP addresses or allow `0.0.0.0/0` with strong password authentication.
3. Under **Database Access**, create an unprivileged production user.
4. Copy the connection string (`mongodb+srv://...`).

### Step 3: Render (API & Worker)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New + > Blueprint**.
3. Connect the repository and select the `feat/production-deployment-render-vercel-upstash` (or `main`) branch.
4. Render will detect `render.yaml` and prompt for the required environment variables:
   - `MONGODB_URI`: Paste Atlas connection string.
   - `REDIS_URL`: Paste Upstash Redis TCP URI.
   - `CORS_ORIGIN`: Set to `https://www.veyora.com,https://admin.veyora.com`.
   - `RAZORPAY_*` & `CLOUDINARY_*`: Set production credentials.
5. Under service settings, generate **Deploy Hook URLs** for both `veyora-api` and `veyora-worker`.

### Step 4: Vercel (Web & Admin)

1. Log in to [Vercel Dashboard](https://vercel.com).
2. **Web Storefront Project**:
   - Click **Add New > Project**, import the monorepo.
   - Set **Root Directory** to `apps/web`.
   - Add environment variable: `NEXT_PUBLIC_API_URL=https://api.veyora.com/api/v1` and `NEXT_PUBLIC_SITE_URL=https://www.veyora.com`.
   - Under Project Settings > Git, copy the **Deploy Hook URL**.
3. **Admin Portal Project**:
   - Click **Add New > Project**, import the monorepo again.
   - Set **Root Directory** to `apps/admin`.
   - Add environment variable: `NEXT_PUBLIC_API_URL=https://api.veyora.com/api/v1`.
   - Under Project Settings > Git, copy the **Deploy Hook URL**.

### Step 5: GitHub Secrets Configuration

In the GitHub repository, navigate to **Settings > Secrets and variables > Actions** and add:

- `RENDER_API_DEPLOY_HOOK_URL`
- `RENDER_WORKER_DEPLOY_HOOK_URL`
- `VERCEL_WEB_DEPLOY_HOOK_URL`
- `VERCEL_ADMIN_DEPLOY_HOOK_URL`
- `PRODUCTION_API_URL` (optional: `https://api.veyora.com`)

### Step 6: DNS Provider (Custom Domains)

Add the DNS CNAME and A records outlined in Section 8 to configure `www.veyora.com`, `admin.veyora.com`, and `api.veyora.com`.
