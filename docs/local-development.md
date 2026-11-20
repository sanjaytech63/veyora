# Local Development Setup

## 1. Prerequisites

Before starting local development on Veyora, ensure your environment has:

- **Node.js**: `v24.13.0` or later (check with `node -v`)
- **npm**: `v11.21.0` or later (check with `npm -v`)
- **Docker**: Docker Engine 24+ and Docker Compose v2 (optional for standalone UI dev, required for running local DB/Redis)
- **Git**: Installed and configured

---

## 2. Initial Setup

### Step 1: Clone and Enter the Repository

```bash
git clone <repository-url> veyora
cd veyora
```

### Step 2: Configure Environment Variables

Copy root and application `.env.example` templates to `.env`:

```bash
# Windows PowerShell:
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env
Copy-Item apps/admin/.env.example apps/admin/.env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/worker/.env.example apps/worker/.env

# Linux / macOS Bash:
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
```

### Step 3: Install Monorepo Dependencies

```bash
npm install
```

---

## 3. Starting Infrastructure Services

Start the development database and caching services using Docker Compose:

```bash
docker compose up -d
```

### Check Service Status

```bash
docker compose ps
```

Expected containers:

- `veyora-mongodb`: Mongo 7.0 listening on port `27017`
- `veyora-redis`: Redis 7.2 listening on port `6379`

### Stopping Infrastructure Services

```bash
docker compose down
```

To also remove persistent volume data:

```bash
docker compose down -v
```

---

## 4. Running the Development Environment

### Option A: Run Full Stack Simultaneously

To start all four applications together with Turborepo:

```bash
npm run dev
```

### Option B: Run Services Individually

You can run any specific application independently in its own terminal:

```bash
# 1. Customer Storefront (Next.js 15 App Router)
# Accessible at: http://localhost:3000
npm run dev:web

# 2. Administration Portal (Next.js 15 App Router)
# Accessible at: http://localhost:3001
npm run dev:admin

# 3. Express API Server
# Accessible at: http://localhost:4000
# Health check: http://localhost:4000/health
# System info:  http://localhost:4000/api/v1/system/info
npm run dev:api

# 4. Background BullMQ Worker
npm run dev:worker
```

---

## 5. Verification Commands

Run full verification across all workspaces:

```bash
# Format code
npm run format

# Run linter
npm run lint

# Run strict TypeScript verification
npm run typecheck

# Build all packages and applications
npm run build
```

---

## 6. Troubleshooting Common Issues

### Port Conflicts

- Port `3000`: Used by `apps/web`. Change `PORT` in `apps/web/.env` if occupied.
- Port `3001`: Used by `apps/admin`. Change `PORT` in `apps/admin/.env` if occupied.
- Port `4000`: Used by `apps/api`. Change `PORT` in `apps/api/.env` if occupied.
- Port `6379`: Used by Redis.
- Port `27017`: Used by MongoDB.

### Resetting Build Caches

If you experience caching anomalies during development:

```bash
npm run clean
npm install
```
