# ==============================================================================
# Production Dockerfile for Veyora Core API
# Multi-stage, non-root execution, minimal attack surface
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

# Copy shared packages and application sources
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies deterministically
RUN npm install --global npm@11.21.0
RUN npm ci

# Compile TypeScript packages and build API distribution
RUN npm run build:packages && npm run build --workspace=@veyora/api

# Prune development dependencies for minimal production footprint
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install wget for healthcheck (included in alpine base)
RUN apk add --no-cache wget

# Copy pruned production dependencies and compiled packages
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages ./packages
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist

# Switch to unprivileged user
USER node

# Expose HTTP port
EXPOSE 4000

# Container liveness & readiness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
