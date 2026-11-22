# ==============================================================================
# Production Dockerfile for Veyora Storefront Web Application
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

# Copy shared packages and web sources
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install dependencies deterministically
RUN npm ci

# Build shared packages and compile Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build:packages && npm run build --workspace=@veyora/web

# ------------------------------------------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache wget

# Copy workspace manifests and built artifacts
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages ./packages
COPY --from=builder --chown=node:node /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=node:node /app/apps/web/.next ./apps/web/.next

# Switch to unprivileged user
USER node

# Expose HTTP port
EXPOSE 3000

# Container liveness & readiness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1

CMD ["npm", "run", "start", "--workspace=@veyora/web"]
