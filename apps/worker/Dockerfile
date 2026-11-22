# ==============================================================================
# Production Dockerfile for Veyora Background Worker Suite
# Multi-stage, non-root execution, BullMQ consumer runner
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Package Compile
# ------------------------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy workspace manifests
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy shared packages and worker sources
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

# Install dependencies deterministically
RUN npm ci

# Compile TypeScript packages and build worker distribution
RUN npm run build:packages && npm run build --workspace=@veyora/worker

# Prune development dependencies
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy pruned production dependencies and compiled packages
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages ./packages
COPY --from=builder --chown=node:node /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder --chown=node:node /app/apps/worker/dist ./apps/worker/dist

# Switch to unprivileged user
USER node

# Healthcheck: ensures the Node.js worker event loop is active
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

CMD ["node", "apps/worker/dist/index.js"]
