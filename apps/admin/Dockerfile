# ==============================================================================
# Production Dockerfile for Veyora Admin Console Application
# Multi-stage Next.js production build, non-root execution
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Asset Compilation
# ------------------------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy workspace manifests
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy shared packages and admin sources
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/

# Install dependencies deterministically
RUN npm install --global npm@11.21.0
RUN npm ci

# Build shared packages and compile Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p apps/admin/public && npm run build:packages && npm run build --workspace=@veyora/admin

# ------------------------------------------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache wget

# Copy workspace manifests and built artifacts
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages ./packages
COPY --from=builder --chown=node:node /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=builder --chown=node:node /app/apps/admin/public ./apps/admin/public
COPY --from=builder --chown=node:node /app/apps/admin/.next ./apps/admin/.next

# Switch to unprivileged user
USER node

# Expose HTTP port
EXPOSE 3001

# Container liveness & readiness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001 || exit 1

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001"]
