# Production Deployment Architecture: Google Cloud Run + Compute Engine MongoDB + Vercel + Upstash

## 1. Overview & Architecture

Veyora is architected as a high-performance modern ecommerce monorepo. In production, backend services run containerized on **Google Cloud Run**, database storage runs containerized on **Google Compute Engine with Persistent Disk** (or managed **MongoDB Atlas**), real-time distributed queues/cache run on **Upstash Redis**, and frontends run on **Vercel** with Next.js 16.

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
            |   Upstash Redis   |                            | Google Compute    |
            | (TCP/TLS rediss:) |                            | Engine VM         |
            +---------^---------+                            | (Docker MongoDB   |
                      |                                      | + Persistent Disk)|
                      +------------------+                   +---------^---------+
                                         |                             |
                                    +----+----------+----+             |
                                    |  Cloud Run Service |             |
                                    |    veyora-worker   |-------------+
                                    | (Continuous Worker)|
                                    +--------------------+
```

| Component              | Platform                 | Deployment Type                                                                   | Production Endpoint / Identifier                        |
| ---------------------- | ------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Web Storefront**     | Vercel                   | Next.js 16 (SSG, PPR, Cache Components)                                           | `https://www.veyora.com`                                |
| **Admin Portal**       | Vercel                   | Next.js 16 (TanStack Query, Dynamic, RBAC)                                        | `https://admin.veyora.com`                              |
| **Backend API**        | Google Cloud Run         | Docker container (Node.js 24 Alpine, non-root)                                    | `https://api.veyora.com`                                |
| **Background Worker**  | Google Cloud Run         | Separate continuous Docker container (`--no-cpu-throttling`, `--min-instances=1`) | Private (Internal only)                                 |
| **MongoDB Database**   | Google Compute Engine    | Official Mongo 7.0 Docker container + GCP Persistent Disk (or Atlas)              | Private VPC IP (`10.128.0.2:27017`)                     |
| **Redis & Queues**     | Upstash Redis            | Managed Redis over TCP with TLS (`rediss://...`)                                  | Private TCP endpoint                                    |
| **Container Registry** | Google Artifact Registry | Docker format with immutable Git commit SHA tags                                  | `LOCATION-docker.pkg.dev/PROJECT_ID/veyora-docker-repo` |
| **CI/CD**              | GitHub Actions           | Workload Identity Federation (Zero static JSON keys)                              | `.github/workflows/deploy-production.yml`               |
| **Secrets Management** | Google Secret Manager    | Encrypted environment variables injected at runtime                               | `projects/PROJECT_ID/secrets/*`                         |

---

## 2. Google Cloud Platform Setup & IAM Permissions

### 2.1 Resolving Missing Cloud Run Admin API Permissions

When visiting the Cloud Run Console, if you encounter:

> _"The Cloud Run Admin API is not enabled. You don't have permission to enable it."_

This indicates your Google Cloud account currently lacks the **Service Usage Admin** (`roles/serviceusage.serviceUsageAdmin`) or **Owner/Editor** role required to activate new Google Cloud APIs on the project.

#### Required Action from the Project Administrator

Request the Google Cloud Project Owner/Admin to run:

```bash
# Enable required APIs on the project
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  cloudbuild.googleapis.com \
  --project=YOUR_PROJECT_ID
```

And grant your IAM user / service account the following least-privilege roles:

- `roles/run.admin` (Cloud Run Administrator)
- `roles/artifactregistry.admin` or `roles/artifactregistry.writer` (Artifact Registry)
- `roles/compute.instanceAdmin.v1` (Compute Engine Instance Admin for MongoDB VM)
- `roles/secretmanager.secretAccessor` (Read access to production secrets)
- `roles/iam.serviceAccountUser` (Permits deploying containers running as the default or custom service account)

### 2.2 Workload Identity Federation for GitHub Actions

To eliminate stored service-account JSON keys in GitHub:

1. Create a service account: `github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com`.
2. Grant it `roles/run.admin`, `roles/artifactregistry.writer`, and `roles/iam.serviceAccountUser`.
3. Create Workload Identity Pool `github-pool` and Provider `github-provider`:
   ```bash
   gcloud iam workload-identity-pools create "github-pool" \
     --project="PROJECT_ID" \
     --location="global" \
     --display-name="GitHub Actions Pool"

   gcloud iam workload-identity-pools providers create-oidc "github-provider" \
     --project="PROJECT_ID" \
     --location="global" \
     --workload-identity-pool="github-pool" \
     --display-name="GitHub Actions Provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
     --issuer-uri="https://token.actions.githubusercontent.com"
   ```
4. Authorize the repository:
   ```bash
   gcloud iam service-accounts add-iam-policy-binding "github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com" \
     --project="PROJECT_ID" \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/sanjaytech63/veyora"
   ```

---

## 3. Containerized MongoDB on Google Compute Engine

While **MongoDB Atlas** is the recommended managed multi-region solution, self-hosting on Google Compute Engine requires strict stateful disk guarantees and security isolation.

### 3.1 Compute Engine Infrastructure Provisioning

1. **Create an Ubuntu VM in your VPC**:

   ```bash
   gcloud compute instances create veyora-mongodb-instance \
     --project=PROJECT_ID \
     --zone=us-central1-a \
     --machine-type=e2-standard-2 \
     --network=default \
     --subnet=default \
     --no-address \
     --tags=mongodb-server \
     --metadata-from-file=startup-script=infra/gce-mongodb/startup-script.sh
   ```

   _(Note: `--no-address` ensures no public IP is attached to the VM; it is reachable only via private VPC IP, e.g. `10.128.0.2`)._

2. **Provision and Attach Persistent Disk**:

   ```bash
   gcloud compute disks create mongodb-data-disk \
     --project=PROJECT_ID \
     --zone=us-central1-a \
     --size=50GB \
     --type=pd-ssd

   gcloud compute instances attach-disk veyora-mongodb-instance \
     --project=PROJECT_ID \
     --zone=us-central1-a \
     --disk=mongodb-data-disk \
     --device-name=mongodb-data
   ```

3. **Deploy Docker Compose**:
   On the VM, files from `infra/gce-mongodb/` are placed in `/opt/veyora-mongodb`:
   - `docker-compose.yml`: Spins up official `mongo:7.0.14` binding to private IP `10.128.0.2:27017` with WiredTiger cache tuning.
   - `init-mongo.js`: Automatically executes on initial startup to create the unprivileged application user `veyora_app_user`.
   - `startup-script.sh`: Automates disk formatting, mounting to `/mnt/disks/mongodb-data`, Docker Engine installation, and service startup.

### 3.2 Automated Backups and Retention

- Nightly cron job (`backup-mongodb.sh`) executes `mongodump --gzip` inside the container.
- Syncs gzip archives to Google Cloud Storage (`gs://veyora-production-backups/mongodb/`).
- Enforces a 7-day local disk retention policy.

### 3.3 Restore Procedure

To restore a snapshot:

```bash
/usr/local/bin/restore-mongodb /mnt/disks/mongodb-data/backups/dump_YYYYMMDD_HHMMSS
```

The script uses `mongorestore --gzip --drop` and validates the database connection with a test ping.

---

## 4. Backend API on Google Cloud Run (`apps/api`)

- **Container Image**: Built via `apps/api/Dockerfile` (Multi-stage Node.js 24 Alpine, non-root `node` user).
- **Port Routing**: Listens on `0.0.0.0` reading `process.env.PORT`.
- **Health Probes**:
  - Liveness: `GET /health/live` (HTTP 200 `{"status":"alive"}`)
  - Readiness: `GET /health/ready` (Verifies MongoDB & Redis status)
- **CORS Policy**: Configured strictly to exact origins (`https://www.veyora.com,https://admin.veyora.com`).
- **Cookies**: HTTP-only, Secure, SameSite=Lax, path `/api/v1/auth`.

---

## 5. Background Worker on Google Cloud Run (`apps/worker`)

### Continuous Processing vs Serverless Scale-to-Zero

Standard Cloud Run request-driven services freeze CPU when no requests are being processed, breaking BullMQ queue consumption.

- **Worker Configuration**:
  - `--no-cpu-throttling`: Allocates CPU continuously.
  - `--min-instances=1`: Guarantees at least 1 warm worker continuously listening for BullMQ queue events.
  - `--no-allow-unauthenticated`: Ingress is blocked from public web traffic.
- **Estimated Operating Cost**:
  - An always-on 1 vCPU / 1 GiB instance running 24/7 on Cloud Run with `--no-cpu-throttling` costs approximately **$25 - $32 / month** on Google Cloud.
  - In comparison, running on a shared Compute Engine VM or alongside MongoDB costs **$10 - $15 / month**.

---

## 6. Upstash Redis Setup

- **Compatibility**: Standard TCP Redis connection over TLS (`rediss://...`).
- BullMQ and `@socket.io/redis-adapter` require native TCP streaming commands.
- `apps/api` and `apps/worker` automatically enable TLS when `REDIS_URL` starts with `rediss://` or `REDIS_TLS=true`.
- Credentials remain strictly server-side.

---

## 7. Vercel Deployments (Storefront & Admin)

### 7.1 Web Storefront (`apps/web`)

- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && npm run build:packages && npm run build --workspace=@veyora/web`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: `https://api.veyora.com/api/v1`
  - `NEXT_PUBLIC_SITE_URL`: `https://www.veyora.com`
  - `INTERNAL_CACHE_SECRET`: Pre-shared revalidation secret
  - `API_URL`: `https://api.veyora.com/api/v1`

### 7.2 Admin Portal (`apps/admin`)

- **Root Directory**: `apps/admin`
- **Build Command**: `cd ../.. && npm run build:packages && npm run build --workspace=@veyora/admin`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: `https://api.veyora.com/api/v1`
  - `API_URL`: `https://api.veyora.com/api/v1`

---

## 8. GitHub Actions CI/CD Pipeline

The workflow `.github/workflows/deploy-production.yml` runs automatically on `main`:

1. **Quality Gates**: `typecheck`, `lint:check`, `format:check`, `test`, `build`.
2. **OIDC Authentication**: Authenticates via Google Cloud Workload Identity Federation.
3. **Container Registry**: Builds API and Worker images and pushes to Artifact Registry with commit SHA tags (`sha-${{ github.sha }}`) and `latest`.
4. **Deploy API**: Deploys `veyora-api` to Cloud Run and verifies `/health/live`.
5. **Deploy Worker**: Deploys `veyora-worker` to Cloud Run with `--no-cpu-throttling` and `--min-instances=1`.
6. **Vercel Deployments**: Triggers Web Storefront and Admin Portal via Deploy Hooks.

---

## 9. Rollback Procedures

### Google Cloud Run

Cloud Run keeps immutable revision history:

1. Open Google Cloud Console > **Cloud Run** > Select `veyora-api` or `veyora-worker`.
2. Go to **Revisions** tab.
3. Select previous working revision > Click **Manage Traffic** > Route 100% of traffic. Instant 1-second rollback.

### Vercel

1. Open Vercel Dashboard > Select Project (`veyora-web` or `veyora-admin`).
2. Go to **Deployments** > Select previous working build > Click `...` > **Promote to Production**.
