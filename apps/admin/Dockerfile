# Production Dockerfile for Veyora Admin Console Application
FROM node:24-alpine AS base

WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/

RUN npm ci
RUN npm run build:packages && npm run build --workspace=@veyora/admin

FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/admin/.next ./apps/admin/.next
COPY --from=base /app/apps/admin/public ./apps/admin/public
COPY --from=base /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=base /app/packages/ ./packages/

USER node
EXPOSE 3001

CMD ["npm", "run", "start", "--workspace=@veyora/admin"]
