# Production Deployment Architecture: Google Cloud Run + Vercel + Upstash Redis

## 1. Overview & Architecture

Veyora is architected as a high-performance modern ecommerce monorepo. In production, backend services run containerized on **Google Cloud Run**, data & queues are hosted on **MongoDB Atlas** and **Upstash Redis**, and frontends run on **Vercel** with Next.js 16.

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
     |    Vercel Project  |          |    Vercel Project  |         |  Google Cloud Run  |
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
                                    |  Cloud Run Service |
                                    |     veyora-api     |
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
                                    |  Cloud Run Service |
                                    |    veyora-worker   |
                                    | (Continuous Worker)|
                                    +--------------------+
```

| Service                | Runtime / Platform                          | Role                                                                                            | Production Domain                                       |
| ---------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **API**                | Google Cloud Run (Containerized Node.js 24) | Express REST API, Socket.IO server, BullMQ producers                                            | `api.veyora.com`                                        |
| **Worker**             | Google Cloud Run (Containerized Node.js 24) | BullMQ consumers, Email/Notification dispatch, Socket.IO Emitter, Storefront cache revalidation | Internal process (`--no-allow-unauthenticated`)         |
| **Storefront**         | Vercel (Next.js 16)                         | Customer-facing ecommerce storefront with Cache Components, SSG, PPR                            | `www.veyora.com`                                        |
| **Admin Portal**       | Vercel (Next.js 16)                         | Back-office management portal with TanStack Query and RBAC                                      | `admin.veyora.com`                                      |
| **Cache & Queues**     | Upstash Redis                               | BullMQ job queue broker, Socket.IO Redis adapter & emitter                                      | Private TCP endpoint (`rediss://...`)                   |
| **Database**           | MongoDB Atlas                               | Primary transactional datastore with replica set                                                | TLS connection string                                   |
| **Container Registry** | Google Artifact Registry                    | Docker container repository with immutable SHA tags                                             | `LOCATION-docker.pkg.dev/PROJECT_ID/veyora-docker-repo` |

---

## 2. Google Cloud Platform Setup

### 2.1 Project & API Enablement

1. In the [Google Cloud Console](https://console.cloud.google.com/), select or create your project (e.g. `veyora-production`).
2. Enable the required APIs:
   - **Cloud Run Admin API** (`run.googleapis.com`)
   - **Artifact Registry API** (`artifactregistry.googleapis.com`)
   - **Cloud Build API** (`cloudbuild.googleapis.com`)
   - **Secret Manager API** (`secretmanager.googleapis.com`)
   - **IAM Service Account Credentials API** (`iamcredentials.googleapis.com`)

### 2.2 Artifact Registry Setup

Create a Docker repository in Artifact Registry:

- **Repository Name**: `veyora-docker-repo`
- **Format**: `Docker`
- **Mode**: `Standard`
- **Location Type**: `Region` (e.g., `us-central1` or region closest to your MongoDB Atlas cluster).

### 2.3 IAM & Workload Identity Federation (Zero Static Keys)

Rather than downloading service account JSON keys (which poses security risks), GitHub Actions authenticates using **Workload Identity Federation**:

1. Create a service account: `github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com`.
2. Grant roles:
   - `roles/run.admin` (Cloud Run Administrator)
   - `roles/artifactregistry.writer` (Artifact Registry Writer)
   - `roles/iam.serviceAccountUser` (Service Account User)
3. Create a Workload Identity Pool: `github-pool`.
4. Add a Provider: `github-provider` (Issuer: `https://token.actions.githubusercontent.com`).
5. Map attributes: `google.subject=assertion.sub`, `attribute.repository=assertion.repository`.
6. Allow the GitHub repository (`sanjaytech63/veyora`) to impersonate the service account.

---

## 3. Backend API Deployment on Google Cloud Run (`apps/api`)

### Container Specification

- Built via [apps/api/Dockerfile](file:///c:/Users/Sanjay/Desktop/veyora/apps/api/Dockerfile) (Multi-stage Alpine, Node.js 24, non-root `node` user).
- Reads port dynamically from `process.env.PORT` (Cloud Run injects `PORT=8080` or container-specified `4000`).
- Binds explicitly to `0.0.0.0`.
- Health check endpoints:
  - Liveness probe: `GET /health/live` (HTTP 200 `{"status":"alive"}`)
  - Readiness probe: `GET /health/ready` (Reports MongoDB and Redis connection status)

### Cloud Run Deployment Configuration

- **CPU**: 1 vCPU
- **Memory**: 1 GiB
- **Concurrency**: 80 requests per instance
- **Min Instances**: `1` (eliminates cold starts)
- **Max Instances**: `10`
- **CPU Allocation**: CPU throttled when not handling requests (`--cpu-throttling`)
- **Ingress**: All (Public HTTPS endpoint)

### Environment Variables Matrix (`@veyora/api`)

| Variable                   | Source                | Example / Default                                                                     | Description                             |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| `NODE_ENV`                 | Cloud Run Env         | `production`                                                                          | Production runtime mode                 |
| `PORT`                     | Injected by Cloud Run | `4000` or `8080`                                                                      | Port container listens on               |
| `API_PREFIX`               | Cloud Run Env         | `/api/v1`                                                                             | Base prefix for REST endpoints          |
| `MONGODB_URI`              | Secret Manager        | `mongodb+srv://user:pass@cluster.mongodb.net/veyora_prod?retryWrites=true&w=majority` | Primary MongoDB Atlas connection string |
| `REDIS_URL`                | Secret Manager        | `rediss://default:xxxx@usw1-xxxx.upstash.io:6379`                                     | Upstash Redis TCP/TLS connection string |
| `JWT_ACCESS_SECRET`        | Secret Manager        | _32+ char secret_                                                                     | Access token signing secret             |
| `JWT_REFRESH_SECRET`       | Secret Manager        | _32+ char secret_                                                                     | Refresh token signing secret            |
| `COOKIE_SECRET`            | Secret Manager        | _32+ char secret_                                                                     | Cookie signing secret                   |
| `CORS_ORIGIN`              | Cloud Run Env         | `https://www.veyora.com,https://admin.veyora.com`                                     | Exact allowed frontend origins          |
| `CLIENT_URL`               | Cloud Run Env         | `https://www.veyora.com`                                                              | Storefront origin                       |
| `ADMIN_URL`                | Cloud Run Env         | `https://admin.veyora.com`                                                            | Admin portal origin                     |
| `RAZORPAY_KEY_ID`          | Secret Manager        | `rzp_live_xxxxxxxxxxxx`                                                               | Live Razorpay key                       |
| `RAZORPAY_KEY_SECRET`      | Secret Manager        | _secret_                                                                              | Live Razorpay secret                    |
| `RAZORPAY_WEBHOOK_SECRET`  | Secret Manager        | _secret_                                                                              | Razorpay webhook validation secret      |
| `CLOUDINARY_CLOUD_NAME`    | Cloud Run Env         | `veyora-cloud`                                                                        | Cloudinary storage bucket name          |
| `CLOUDINARY_API_KEY`       | Secret Manager        | `xxxxxxxxx`                                                                           | Cloudinary API Key                      |
| `CLOUDINARY_API_SECRET`    | Secret Manager        | _secret_                                                                              | Cloudinary API Secret                   |
| `CLOUDINARY_UPLOAD_FOLDER` | Cloud Run Env         | `veyora`                                                                              | Cloudinary asset folder                 |

---

## 4. Background Worker Deployment on Google Cloud Run (`apps/worker`)

### Cloud Run Continuous Worker Architecture

Standard Cloud Run services throttle CPU to zero when no incoming HTTP requests exist, which would pause background BullMQ queue workers. To solve this reliably:

1. **Always-On CPU**: Configured with `--no-cpu-throttling` (CPU is always allocated).
2. **Min Instances**: Set to `--min-instances=1` (keeps at least 1 instance continuously polling Redis for jobs).
3. **No Unauthenticated HTTP Ingress**: Set to `--no-allow-unauthenticated` so external public web traffic cannot trigger the worker.
4. **BullMQ Reliability**: Connects via Upstash TCP Redis (`rediss://...`) with `maxRetriesPerRequest: null`.
5. **No unnecessary HTTP servers**: The worker process runs purely event-driven BullMQ workers and handles graceful `SIGTERM` draining.

### Environment Variables Matrix (`@veyora/worker`)

| Variable                | Source         | Example / Default                                 | Description                                |
| ----------------------- | -------------- | ------------------------------------------------- | ------------------------------------------ |
| `NODE_ENV`              | Cloud Run Env  | `production`                                      | Production mode                            |
| `MONGODB_URI`           | Secret Manager | `mongodb+srv://...`                               | MongoDB Atlas connection string            |
| `REDIS_URL`             | Secret Manager | `rediss://default:xxxx@usw1-xxxx.upstash.io:6379` | Upstash Redis connection URI               |
| `CONCURRENCY`           | Cloud Run Env  | `5`                                               | BullMQ worker concurrency per queue        |
| `STOREFRONT_URL`        | Cloud Run Env  | `https://www.veyora.com`                          | Storefront base URL for cache revalidation |
| `INTERNAL_CACHE_SECRET` | Secret Manager | _32+ char secret_                                 | Secret matching Next.js revalidation route |

---

## 5. Upstash Redis Setup

- **Protocol**: Standard Redis TCP with TLS enabled (`rediss://...`).
- Upstash REST/HTTP API is NOT used for BullMQ workers because BullMQ requires persistent bidirectional TCP socket connections and stream commands (`XREAD`, `BRPOPLPUSH`, etc.).
- Both `apps/api` and `apps/worker` automatically recognize `REDIS_URL` with `rediss://` or `REDIS_TLS=true` and instantiate `ioredis` with TLS options.

---

## 6. Vercel Web Storefront (`apps/web`) & Admin Portal (`apps/admin`)

Both applications are deployed as independent projects on Vercel:

- **`apps/web`**:
  - Root Directory: `apps/web`
  - Build command: `cd ../.. && npm run build:packages && npm run build --workspace=@veyora/web`
  - `NEXT_PUBLIC_API_URL` = `https://api.veyora.com/api/v1`
  - `NEXT_PUBLIC_SITE_URL` = `https://www.veyora.com`
  - `INTERNAL_CACHE_SECRET` = Pre-shared worker revalidation secret (server-only)
- **`apps/admin`**:
  - Root Directory: `apps/admin`
  - Build command: `cd ../.. && npm run build:packages && npm run build --workspace=@veyora/admin`
  - `NEXT_PUBLIC_API_URL` = `https://api.veyora.com/api/v1`

---

## 7. Authentication, CORS, and Cookies

1. **CORS**:
   - `CORS_ORIGIN` contains the exact Vercel frontend domains (`https://www.veyora.com,https://admin.veyora.com`).
   - Wildcards are rejected in production when credentials are sent.
2. **Refresh Token Cookie**:
   - `httpOnly: true` (XSS immune)
   - `secure: true` (HTTPS only)
   - `sameSite: "lax"`
   - `path: "/api/v1/auth"` (Restricts cookie transmission strictly to auth endpoints)
3. **Session Refresh**:
   - Web Storefront and Admin Portal client code includes `credentials: "include"`.
   - Next.js Server Components forward cookies through `server-api-client.ts`.

---

## 8. GitHub Actions CI/CD Pipeline

The `.github/workflows/deploy-production.yml` workflow automates the deployment:

1. **Pre-Deployment Quality Gates**:
   - `npm run typecheck`
   - `npm run lint:check`
   - `npm run format:check`
   - `npm run test`
   - `npm run build`
2. **Google Cloud Authentication**:
   - Authenticates using `google-github-actions/auth` with Workload Identity Federation (no stored credentials).
3. **Artifact Registry**:
   - Builds API & Worker Docker containers using Buildx.
   - Pushes images tagged with commit SHA (`${{ github.sha }}`) and `latest`.
4. **Cloud Run Deployment**:
   - Deploys `veyora-api` to Cloud Run.
   - Deploys `veyora-worker` to Cloud Run with `--no-cpu-throttling` and `--min-instances=1`.
5. **Vercel Deployment**:
   - Dispatches Vercel deploy hooks for `veyora-web` and `veyora-admin`.

### GitHub Secrets and Variables Required

#### Variables (`vars`)

- `GCP_PROJECT_ID`: Google Cloud Project ID (e.g. `veyora-production`)
- `GCP_REGION`: Target region (e.g. `us-central1`)
- `GCP_ARTIFACT_REPO`: Artifact Registry repo name (`veyora-docker-repo`)

#### Secrets (`secrets`)

- `GCP_WORKLOAD_IDENTITY_PROVIDER`: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- `GCP_SERVICE_ACCOUNT`: `github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com`
- `VERCEL_WEB_DEPLOY_HOOK_URL`: Vercel Deploy Hook for Storefront
- `VERCEL_ADMIN_DEPLOY_HOOK_URL`: Vercel Deploy Hook for Admin

---

## 9. Rollback Procedures

### Google Cloud Run (API & Worker)

Cloud Run maintains an immutable revision history for every deployment:

1. In the Google Cloud Console, navigate to **Cloud Run** > Click `veyora-api` or `veyora-worker`.
2. Go to the **Revisions** tab.
3. Select the previous stable revision.
4. Click **Manage Traffic** > Route 100% of traffic to the stable revision (instant 1-second atomic rollback).

### Vercel (Web & Admin)

1. Go to Vercel Dashboard > Select Project (`veyora-web` or `veyora-admin`).
2. Go to the **Deployments** tab.
3. Find the previous stable deployment > Click `...` > **Promote to Production**.
