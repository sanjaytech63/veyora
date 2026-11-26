# Production Deployment Guide: Render + Vercel + Upstash Redis

## 1. Overview & Architecture

Veyora is architected as a high-performance ecommerce monorepo. In production, services are decoupled into specialized cloud platforms:

```
                           +----------------------------------------+
                           |           Cloudflare DNS               |
                           |   (SSL Termination & CDN Proxying)     |
                           +----+---------------+--------------+----+
                                |               |              |
                +---------------+               |              +---------------+
                |                               |                              |
                v                               v                              v
     +--------------------+          +--------------------+         +--------------------+
     |    Vercel Project  |          |    Vercel Project  |         |   Render Service   |
     |    (@veyora/web)   |          |   (@veyora/admin)  |         |    (@veyora/api)   |
     |   www.veyora.com   |          |  admin.veyora.com  |         |   api.veyora.com   |
     +---------+----------+          +---------+----------+         +---------+----------+
               |                               |                              |
               +-------------------------------+------------------------------+
                                               |
                                     (REST / HTTPS / WSS)
                                               |
                                               v
                                    +--------------------+
                                    |    Render API      |
                                    |   0.0.0.0:$PORT    |
                                    +----+----------+----+
                                         |          |
                      +------------------+          +------------------+
                      |                                                |
                      v                                                v
            +-------------------+                            +-------------------+
            |   Upstash Redis   |                            |   MongoDB Atlas   |
            | (TCP/TLS rediss:) |                            |   (M10+ Cluster)  |
            +---------^---------+                            +---------^---------+
                      |                                                |
                      +------------------+          +------------------+
                                         |          |
                                    +----+----------+----+
                                    |   Render Worker    |
                                    |  (@veyora/worker)  |
                                    +--------------------+
```

| Service            | Runtime / Platform                 | Role                                                                                            | Production Domain     |
| ------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------- |
| **API**            | Render Web Service (Node.js)       | Express REST API, Socket.IO server, BullMQ producers                                            | `api.veyora.com`      |
| **Worker**         | Render Background Worker (Node.js) | BullMQ consumers, Email/Notification dispatch, Socket.IO Emitter, Storefront cache revalidation | Internal process      |
| **Storefront**     | Vercel (Next.js 16)                | Customer-facing ecommerce storefront with Cache Components and ISR                              | `www.veyora.com`      |
| **Admin Portal**   | Vercel (Next.js 16)                | Back-office management portal with TanStack Query and RBAC                                      | `admin.veyora.com`    |
| **Cache & Queues** | Upstash Redis                      | BullMQ job queue broker, Socket.IO Redis adapter & emitter                                      | Private TCP endpoint  |
| **Database**       | MongoDB Atlas                      | Primary transactional datastore with replica set                                                | TLS connection string |

---

## 2. Upstash Redis Configuration

Upstash Redis is used for high-availability distributed caching, BullMQ job queues, and cross-process Socket.IO pub/sub.

### Protocol Compatibility Requirements

- **BullMQ and `@socket.io/redis-adapter` require a standard Redis TCP connection with TLS support** (`rediss://...`), NOT the Upstash REST/HTTP API.
- BullMQ requires `maxRetriesPerRequest: null` and long-lived bidirectional streaming sockets.
- The codebase handles `REDIS_URL` automatically:
  - If `REDIS_URL` begins with `rediss://` or `REDIS_TLS=true`, TLS options `{}` are passed to `ioredis`.
  - If discrete configuration is provided (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS`), it connects accordingly.

### Connection Settings in Upstash Console

1. Create a Redis database in Upstash (select the region matching Render, e.g., `us-west-1` / `oregon` / `us-east-1`).
2. Navigate to **Database Details** > **Connect with Redis CLI / ioredis**.
3. Copy the **TCP Connection String** starting with `rediss://default:PASSWORD@ENDPOINT:PORT`.
4. Configure this connection string in Render as `REDIS_URL`.

---

## 3. Render Web Service Deployment: `@veyora/api`

### Render Dashboard Configuration

- **Type**: Web Service
- **Name**: `veyora-api`
- **Region**: Oregon (or your chosen region close to MongoDB & Upstash)
- **Branch**: `main`
- **Root Directory**: `.` (Monorepo root)
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  npm run build:packages && npm run build --workspace=@veyora/api
  ```
- **Start Command**:
  ```bash
  npm run start --workspace=@veyora/api
  ```
- **Auto-Deploy**: Yes (or triggered via Deploy Hook from GitHub Actions)
- **Health Check Path**: `/health/live`

### Environment Variables Checklist (`@veyora/api`)

| Variable                   | Required | Example / Default                                                                     | Description                                  |
| -------------------------- | -------- | ------------------------------------------------------------------------------------- | -------------------------------------------- |
| `NODE_ENV`                 | Yes      | `production`                                                                          | Enforces production security checks          |
| `PORT`                     | Yes      | `10000`                                                                               | Port assigned by Render                      |
| `API_PREFIX`               | Yes      | `/api/v1`                                                                             | Base prefix for REST endpoints               |
| `MONGODB_URI`              | Yes      | `mongodb+srv://user:pass@cluster.mongodb.net/veyora_prod?retryWrites=true&w=majority` | MongoDB Atlas connection string              |
| `REDIS_URL`                | Yes      | `rediss://default:xxxx@usw1-xxxx.upstash.io:6379`                                     | Upstash Redis TCP connection URI             |
| `JWT_ACCESS_SECRET`        | Yes      | _32+ char random string_                                                              | Secret for signing short-lived access tokens |
| `JWT_REFRESH_SECRET`       | Yes      | _32+ char random string_                                                              | Secret for signing session refresh tokens    |
| `COOKIE_SECRET`            | Yes      | _32+ char random string_                                                              | Secret for signing HTTP-only cookies         |
| `CORS_ORIGIN`              | Yes      | `https://www.veyora.com,https://admin.veyora.com`                                     | Exact allowed frontend origins               |
| `CLIENT_URL`               | Yes      | `https://www.veyora.com`                                                              | Storefront origin                            |
| `ADMIN_URL`                | Yes      | `https://admin.veyora.com`                                                            | Admin portal origin                          |
| `RAZORPAY_KEY_ID`          | Yes      | `rzp_live_xxxxxxxxxxxx`                                                               | Live Razorpay Key ID                         |
| `RAZORPAY_KEY_SECRET`      | Yes      | _live secret_                                                                         | Live Razorpay Key Secret                     |
| `RAZORPAY_WEBHOOK_SECRET`  | Yes      | _webhook secret_                                                                      | Razorpay webhook validation secret           |
| `CLOUDINARY_CLOUD_NAME`    | Yes      | `veyora-cloud`                                                                        | Cloudinary storage bucket name               |
| `CLOUDINARY_API_KEY`       | Yes      | `xxxxxxxxx`                                                                           | Cloudinary API Key                           |
| `CLOUDINARY_API_SECRET`    | Yes      | _secret_                                                                              | Cloudinary API Secret                        |
| `CLOUDINARY_UPLOAD_FOLDER` | No       | `veyora`                                                                              | Cloudinary asset folder                      |
| `RATE_LIMIT_WINDOW_MS`     | No       | `900000`                                                                              | Rate limit window in ms (15 minutes)         |
| `RATE_LIMIT_MAX`           | No       | `100`                                                                                 | Request limit per IP per window              |
| `BODY_LIMIT`               | No       | `10mb`                                                                                | Max JSON payload size                        |
| `LOG_LEVEL`                | No       | `info`                                                                                | Structured logging verbosity                 |

---

## 4. Render Background Worker Deployment: `@veyora/worker`

The worker is deployed as an independent Render Background Worker service.

### Render Dashboard Configuration

- **Type**: Background Worker
- **Name**: `veyora-worker`
- **Region**: Oregon (same as API)
- **Branch**: `main`
- **Root Directory**: `.` (Monorepo root)
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  npm run build:packages && npm run build --workspace=@veyora/worker
  ```
- **Start Command**:
  ```bash
  npm run start --workspace=@veyora/worker
  ```
- **Auto-Deploy**: Yes (or triggered via Deploy Hook)

### Environment Variables Checklist (`@veyora/worker`)

| Variable                | Required | Example / Default                                 | Description                                           |
| ----------------------- | -------- | ------------------------------------------------- | ----------------------------------------------------- |
| `NODE_ENV`              | Yes      | `production`                                      | Production mode                                       |
| `MONGODB_URI`           | Yes      | `mongodb+srv://...`                               | MongoDB Atlas connection string                       |
| `REDIS_URL`             | Yes      | `rediss://default:xxxx@usw1-xxxx.upstash.io:6379` | Upstash Redis connection URI                          |
| `CONCURRENCY`           | No       | `5`                                               | BullMQ worker concurrency per queue                   |
| `STOREFRONT_URL`        | Yes      | `https://www.veyora.com`                          | Storefront base URL for cache revalidation            |
| `INTERNAL_CACHE_SECRET` | Yes      | _32+ char secret_                                 | Pre-shared secret matching Next.js revalidation route |

---

## 5. Vercel Web Storefront Deployment: `@veyora/web`

### Vercel Dashboard Configuration

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && npm run build:packages && npm run build --workspace=@veyora/web`
- **Install Command**: `npm ci`
- **Output Directory**: Automatically handled by Next.js (`.next`)

### Environment Variables Checklist (`@veyora/web`)

| Variable                | Exposed to Client | Value / Example                 | Purpose                                          |
| ----------------------- | ----------------- | ------------------------------- | ------------------------------------------------ |
| `NODE_ENV`              | No                | `production`                    | Next.js environment                              |
| `NEXT_PUBLIC_API_URL`   | Yes               | `https://api.veyora.com/api/v1` | Base URL for browser API calls                   |
| `NEXT_PUBLIC_SITE_URL`  | Yes               | `https://www.veyora.com`        | Storefront canonical URL                         |
| `INTERNAL_CACHE_SECRET` | No (Server only)  | _secret_                        | Authenticates worker cache invalidation requests |
| `API_URL`               | No (Server only)  | `https://api.veyora.com/api/v1` | Server Component internal data fetch URL         |

> [!CAUTION]
> Never set `MONGODB_URI`, `REDIS_URL`, `JWT_ACCESS_SECRET`, or `RAZORPAY_KEY_SECRET` in Vercel. Frontend builds must never have access to private database or broker credentials.

---

## 6. Vercel Admin Portal Deployment: `@veyora/admin`

### Vercel Dashboard Configuration

- **Framework Preset**: Next.js
- **Root Directory**: `apps/admin`
- **Build Command**: `cd ../.. && npm run build:packages && npm run build --workspace=@veyora/admin`
- **Install Command**: `npm ci`
- **Output Directory**: Automatically handled by Next.js (`.next`)

### Environment Variables Checklist (`@veyora/admin`)

| Variable              | Exposed to Client | Value / Example                 | Purpose                                |
| --------------------- | ----------------- | ------------------------------- | -------------------------------------- |
| `NODE_ENV`            | No                | `production`                    | Next.js environment                    |
| `NEXT_PUBLIC_API_URL` | Yes               | `https://api.veyora.com/api/v1` | Backend API base URL for Admin browser |
| `API_URL`             | No (Server only)  | `https://api.veyora.com/api/v1` | Server Component internal fetch URL    |

---

## 7. CORS, Cookies, and Authentication Architecture

### Production Cross-Origin Credential Policy

- **Wildcard CORS (`*`) is strictly forbidden** when credentials are used.
- `CORS_ORIGIN` in the backend API must be set to the exact origins:
  ```env
  CORS_ORIGIN=https://www.veyora.com,https://admin.veyora.com
  ```
- All client fetch requests specify `credentials: "include"`.

### HTTP-Only Cookie Configuration

The refresh token cookie is set by the API on login/verification:

- `httpOnly: true` (prevents XSS extraction)
- `secure: true` (transmitted only over HTTPS)
- `sameSite: "lax"` (protects against CSRF while permitting cross-subdomain top-level navigations)
- `path: "/api/v1/auth"` (scopes cookie strictly to authentication endpoints)

### Dual-Channel Refresh Handling

1. **Direct Browser Calls**: The browser sends `credentials: "include"` directly to `https://api.veyora.com/api/v1/auth/refresh`. Because the path is `/api/v1/auth`, the browser attaches the cookie.
2. **Server-Side Session Forwarding**: In Next.js Server Components / Actions, `server-api-client.ts` reads the incoming request cookies and forwards `refreshToken` in the outbound `Cookie` header.
3. **Payload Fallback**: If cookie delivery is blocked by strict cross-site partitioning, the client can supply `{ refreshToken }` in the request body.

---

## 8. Domain and DNS Architecture

For apex domain `veyora.com`:

| Hostname           | Type  | Target                    | Managed By              |
| ------------------ | ----- | ------------------------- | ----------------------- |
| `www.veyora.com`   | CNAME | `cname.vercel-dns.com`    | Vercel (Web Storefront) |
| `admin.veyora.com` | CNAME | `cname.vercel-dns.com`    | Vercel (Admin Portal)   |
| `api.veyora.com`   | CNAME | `veyora-api.onrender.com` | Render (Backend API)    |

SSL/TLS certificates are automatically provisioned and renewed via Let's Encrypt by Vercel and Render.

---

## 9. CI/CD & GitHub Actions Automation

The repository includes automated CI and CD workflows:

- `.github/workflows/ci.yml`: Runs on PRs and pushes to `main`/`develop`:
  1. Code Quality & Linting (`npm run lint:check`, `npm run format:check`)
  2. Strict TypeScript Typecheck (`npm run typecheck`)
  3. Unit & Integration Tests (`npm run test`)
  4. Monorepo Build Verification (`npm run build`)
  5. Docker Build Validation
- `.github/workflows/deploy-production.yml`: Runs on pushes to `main`:
  1. Executes pre-deployment quality gates (`typecheck`, `lint:check`, `test`, `build`)
  2. Dispatches Render Deploy Hooks (`RENDER_API_DEPLOY_HOOK_URL`, `RENDER_WORKER_DEPLOY_HOOK_URL`)
  3. Dispatches Vercel Deploy Hooks (`VERCEL_WEB_DEPLOY_HOOK_URL`, `VERCEL_ADMIN_DEPLOY_HOOK_URL`)

### Required GitHub Repository Secrets

| Secret Name                     | Description                                |
| ------------------------------- | ------------------------------------------ |
| `RENDER_API_DEPLOY_HOOK_URL`    | Render Deploy Hook URL for `veyora-api`    |
| `RENDER_WORKER_DEPLOY_HOOK_URL` | Render Deploy Hook URL for `veyora-worker` |
| `VERCEL_WEB_DEPLOY_HOOK_URL`    | Vercel Deploy Hook URL for `veyora-web`    |
| `VERCEL_ADMIN_DEPLOY_HOOK_URL`  | Vercel Deploy Hook URL for `veyora-admin`  |

---

## 10. Production Smoke-Test Checklist

### Backend API (`api.veyora.com`)

- [ ] `GET /health/live` returns HTTP 200 `{"status":"alive"}`.
- [ ] `GET /health/ready` returns HTTP 200 with MongoDB and Redis statuses `connected`.
- [ ] `OPTIONS /api/v1/auth/login` from `https://www.veyora.com` returns HTTP 204 with `Access-Control-Allow-Credentials: true`.
- [ ] `POST /api/v1/auth/login` sets `refreshToken` cookie with `Secure; HttpOnly; SameSite=Lax`.
- [ ] Unauthenticated calls to `/api/v1/admin/analytics/dashboard` return HTTP 401.

### Background Worker

- [ ] Worker logs show: `MongoDB connection established in worker process`.
- [ ] Worker logs show: `Redis connection is ready`.
- [ ] BullMQ queues (`veyora-email`, `veyora-notifications`, `veyora-orders`, `veyora-payments`, `veyora-system`) register without warnings.
- [ ] SIGTERM triggers graceful draining and clean shutdown.

### Web Storefront (`www.veyora.com`)

- [ ] Homepage loads with SSR and image optimization via Cloudinary.
- [ ] Catalog search and filter interact seamlessly with API.
- [ ] Cart, wishlist, and session survive browser reload.
- [ ] Revalidation webhook `/api/internal/cache/revalidate` rejects invalid secrets with HTTP 401.

### Admin Portal (`admin.veyora.com`)

- [ ] Non-admin accounts receive HTTP 403 on protected routes.
- [ ] Real-time Socket.IO operational rooms receive notifications.

---

## 11. Rollback Procedures

### Render (API & Worker)

1. Go to the **Render Dashboard** > Select Service (`veyora-api` or `veyora-worker`).
2. Navigate to the **Events** tab.
3. Identify the previous successful deploy.
4. Click **Rollback to this deploy**.

### Vercel (Web & Admin)

1. Go to the **Vercel Dashboard** > Select Project (`veyora-web` or `veyora-admin`).
2. Navigate to the **Deployments** tab.
3. Locate the previous healthy production deployment.
4. Click the three dots `...` > **Promote to Production** (Instant atomic rollback).

### Database & Redis

- Upstash Redis: In case of corrupted queue state, flush the specific BullMQ keys (`bull:veyora-*:*`) without dropping application data.
- MongoDB Atlas: Restore from continuous Point-In-Time Backup (PITR) via Atlas Console > Backups.
