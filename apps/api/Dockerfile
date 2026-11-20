# Production Dockerfile for Veyora Core API
FROM node:24-alpine AS base

WORKDIR /app

# Step 1: Install build tools
RUN apk add --no-cache libc6-compat

# Step 2: Copy repository dependencies
COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Step 3: Install all dependencies
RUN npm ci

# Step 4: Build shared packages and API application
RUN npm run build:packages && npm run build --workspace=@veyora/api

# Step 5: Production runner stage
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/package.json
COPY --from=base /app/packages/ ./packages/

EXPOSE 4000

CMD ["node", "apps/api/dist/server.js"]
