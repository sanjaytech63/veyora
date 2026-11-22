# Production Dockerfile for Veyora Background Worker Suite
FROM node:24-alpine AS base

WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy dependency manifests
COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

# Install dependencies and build shared packages & worker
RUN npm ci
RUN npm run build:packages && npm run build --workspace=@veyora/worker

# Production runner stage
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/worker/dist ./apps/worker/dist
COPY --from=base /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=base /app/packages/ ./packages/

USER node

CMD ["node", "apps/worker/dist/index.js"]
