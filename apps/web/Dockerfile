# Production Dockerfile for Veyora Storefront Web Application
FROM node:24-alpine AS base

WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN npm ci
RUN npm run build:packages && npm run build --workspace=@veyora/web

FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/package.json ./apps/web/package.json
COPY --from=base /app/packages/ ./packages/

USER node
EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@veyora/web"]
