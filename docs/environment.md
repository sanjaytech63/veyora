# Environment Configuration Catalog

This document details all environment variables across Veyora applications, workers, and infrastructure.

---

## 1. Root / Infrastructure (`.env`)

| Variable              | Type     | Default                                                                       | Description                                                                 |
| :-------------------- | :------- | :---------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| `NODE_ENV`            | `string` | `development`                                                                 | Target runtime environment (`development`, `test`, `staging`, `production`) |
| `WEB_PORT`            | `number` | `3000`                                                                        | Port for the customer storefront                                            |
| `ADMIN_PORT`          | `number` | `3001`                                                                        | Port for the administration portal                                          |
| `API_PORT`            | `number` | `4000`                                                                        | Port for the core Express API server                                        |
| `API_PREFIX`          | `string` | `/api/v1`                                                                     | URL prefix for REST endpoints                                               |
| `MONGO_ROOT_USER`     | `string` | `root`                                                                        | Root administrator username for MongoDB container                           |
| `MONGO_ROOT_PASSWORD` | `string` | `veyora_mongo_dev`                                                            | Root administrator password for MongoDB container                           |
| `MONGO_PORT`          | `number` | `27017`                                                                       | Host port mapped to MongoDB container                                       |
| `MONGO_DATABASE`      | `string` | `veyora_dev`                                                                  | Default database created upon MongoDB initialization                        |
| `MONGODB_URI`         | `string` | `mongodb://root:veyora_mongo_dev@127.0.0.1:27017/veyora_dev?authSource=admin` | Full MongoDB connection string                                              |
| `REDIS_HOST`          | `string` | `127.0.0.1`                                                                   | Redis host address                                                          |
| `REDIS_PORT`          | `number` | `6379`                                                                        | Redis port address                                                          |
| `REDIS_PASSWORD`      | `string` | `veyora_redis_dev`                                                            | Authentication password for Redis server                                    |
| `WORKER_CONCURRENCY`  | `number` | `5`                                                                           | Number of simultaneous BullMQ job processors                                |

---

## 2. Customer Storefront (`apps/web/.env`)

| Variable              | Type           | Default                        | Description                                            |
| :-------------------- | :------------- | :----------------------------- | :----------------------------------------------------- |
| `NODE_ENV`            | `string`       | `development`                  | Runtime environment                                    |
| `PORT`                | `number`       | `3000`                         | Next.js local development server listening port        |
| `NEXT_PUBLIC_API_URL` | `string` (URL) | `http://localhost:4000/api/v1` | Public API endpoint for browser and client fetch calls |

---

## 3. Administration Portal (`apps/admin/.env`)

| Variable              | Type           | Default                        | Description                                     |
| :-------------------- | :------------- | :----------------------------- | :---------------------------------------------- |
| `NODE_ENV`            | `string`       | `development`                  | Runtime environment                             |
| `PORT`                | `number`       | `3001`                         | Next.js local development server listening port |
| `NEXT_PUBLIC_API_URL` | `string` (URL) | `http://localhost:4000/api/v1` | Public API endpoint for administrative actions  |

---

## 4. Core API Service (`apps/api/.env`)

| Variable         | Type     | Default                                                                       | Description                                   |
| :--------------- | :------- | :---------------------------------------------------------------------------- | :-------------------------------------------- |
| `NODE_ENV`       | `string` | `development`                                                                 | Runtime environment                           |
| `PORT`           | `number` | `4000`                                                                        | Port on which the Express HTTP server listens |
| `API_PREFIX`     | `string` | `/api/v1`                                                                     | Base route prefix for API routes              |
| `CORS_ORIGIN`    | `string` | `*`                                                                           | Allowed CORS origins (comma-separated or `*`) |
| `REDIS_HOST`     | `string` | `127.0.0.1`                                                                   | Redis connection host                         |
| `REDIS_PORT`     | `number` | `6379`                                                                        | Redis connection port                         |
| `REDIS_PASSWORD` | `string` | `veyora_redis_dev`                                                            | Redis authentication password                 |
| `MONGODB_URI`    | `string` | `mongodb://root:veyora_mongo_dev@127.0.0.1:27017/veyora_dev?authSource=admin` | MongoDB URI                                   |

---

## 5. Background Worker Service (`apps/worker/.env`)

| Variable         | Type     | Default            | Description                                               |
| :--------------- | :------- | :----------------- | :-------------------------------------------------------- |
| `NODE_ENV`       | `string` | `development`      | Runtime environment                                       |
| `REDIS_HOST`     | `string` | `127.0.0.1`        | Redis connection host for BullMQ                          |
| `REDIS_PORT`     | `number` | `6379`             | Redis connection port                                     |
| `REDIS_PASSWORD` | `string` | `veyora_redis_dev` | Redis authentication password                             |
| `CONCURRENCY`    | `number` | `5`                | Maximum number of concurrent jobs processed by the worker |

---

## 6. Security Best Practices

- Never commit unencrypted production credentials to Git.
- Always add `.env` and `.env*.local` to `.gitignore`.
- In production, inject secrets using container environment variables or a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault, Doppler).
