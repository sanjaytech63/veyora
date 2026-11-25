# Veyora Architecture — Environment Variable Governance & Security Boundaries

## 1. Principles & Threat Modeling

Veyora enforces strict separation between client-accessible configuration and server-only secrets. The architecture guarantees:

1. **Zero Client-Side Secret Exposure:** No database URIs, payment gateway private keys, JWT signing keys, or cloud storage secrets are prefixed with `NEXT_PUBLIC_`.
2. **Schema-Enforced Validation:** Every application and service validates its environment configuration at boot time using strongly typed Zod schemas defined in `@veyora/validators`.
3. **Fail-Fast Boot Lifecycle:** If any required environment variable is missing or malformed, the process aborts immediately with structured diagnostics.
4. **Production Fallback Blocking:** In `NODE_ENV === "production"`, schemas explicitly disallow dev/staging fallback values for secrets and reject wildcard CORS configurations.

---

## 2. Environment Ownership & Variable Reference

### 2.1 Customer Storefront (`apps/web`)

Validated via `webEnvSchema` from `@veyora/validators`.

| Variable              | Scope           | Type     | Default / Example              | Purpose                               |
| :-------------------- | :-------------- | :------- | :----------------------------- | :------------------------------------ |
| `NODE_ENV`            | Build/Runtime   | `enum`   | `"development"`                | Node runtime environment              |
| `PORT`                | Server          | `number` | `3000`                         | Port for storefront HTTP server       |
| `NEXT_PUBLIC_API_URL` | Public (Client) | `url`    | `http://localhost:4000/api/v1` | Public API endpoint for browser calls |

### 2.2 Admin Portal (`apps/admin`)

Validated via `adminEnvSchema` from `@veyora/validators`.

| Variable              | Scope           | Type     | Default / Example              | Purpose                               |
| :-------------------- | :-------------- | :------- | :----------------------------- | :------------------------------------ |
| `NODE_ENV`            | Build/Runtime   | `enum`   | `"development"`                | Node runtime environment              |
| `PORT`                | Server          | `number` | `3001`                         | Port for administration portal server |
| `NEXT_PUBLIC_API_URL` | Public (Client) | `url`    | `http://localhost:4000/api/v1` | Public API endpoint for browser calls |

### 2.3 Express API (`apps/api`)

Validated via `apiEnvSchema` from `@veyora/validators`.

| Variable                      | Scope         | Type            | Default / Example                               | Purpose                           |
| :---------------------------- | :------------ | :-------------- | :---------------------------------------------- | :-------------------------------- |
| `NODE_ENV`                    | Server        | `enum`          | `"development"`                                 | Application environment           |
| `PORT`                        | Server        | `number`        | `4000`                                          | API HTTP listener port            |
| `API_PREFIX`                  | Server        | `string`        | `"/api/v1"`                                     | URL prefix for REST endpoints     |
| `CORS_ORIGIN`                 | Server        | `string`        | `"http://localhost:3000,http://localhost:3001"` | Allowed frontend origins          |
| `COOKIE_SECRET`               | Server Secret | `string (>=16)` | _Encrypted Secret_                              | Cookie signing key                |
| `JWT_ACCESS_SECRET`           | Server Secret | `string (>=32)` | _Encrypted Secret_                              | HMAC key for access tokens        |
| `JWT_REFRESH_SECRET`          | Server Secret | `string (>=32)` | _Encrypted Secret_                              | HMAC key for refresh tokens       |
| `JWT_ACCESS_EXPIRES_IN`       | Server        | `string`        | `"15m"`                                         | Access token lifespan             |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | Server        | `number`        | `7`                                             | Refresh token lifespan            |
| `OTP_EXPIRES_IN_MINUTES`      | Server        | `number`        | `10`                                            | Email OTP validity duration       |
| `OTP_MAX_ATTEMPTS`            | Server        | `number`        | `3`                                             | Maximum verification attempts     |
| `MONGODB_URI`                 | Server Secret | `string`        | `mongodb://127.0.0.1:27017/veyora_dev`          | MongoDB connection string         |
| `REDIS_HOST`                  | Server        | `string`        | `"127.0.0.1"`                                   | Redis server hostname             |
| `REDIS_PORT`                  | Server        | `number`        | `6379`                                          | Redis TCP port                    |
| `REDIS_PASSWORD`              | Server Secret | `string`        | `""`                                            | Redis auth password               |
| `RAZORPAY_KEY_ID`             | Server        | `string`        | `rzp_test_...`                                  | Razorpay public key ID            |
| `RAZORPAY_KEY_SECRET`         | Server Secret | `string`        | _Private Secret_                                | Razorpay secret key               |
| `RAZORPAY_WEBHOOK_SECRET`     | Server Secret | `string`        | _Private Secret_                                | Razorpay webhook signature secret |
| `CLOUDINARY_CLOUD_NAME`       | Server        | `string`        | `"veyora-cloud"`                                | Cloudinary tenant account         |
| `CLOUDINARY_API_KEY`          | Server Secret | `string`        | `"veyora_cloud_api_key_..."`                    | Cloudinary API key                |
| `CLOUDINARY_API_SECRET`       | Server Secret | `string`        | _Private Secret_                                | Cloudinary API secret             |
| `CLOUDINARY_UPLOAD_FOLDER`    | Server        | `string`        | `"veyora"`                                      | Root folder for uploaded media    |

### 2.4 Background Worker (`apps/worker`)

Validated via `workerEnvSchema` from `@veyora/validators`.

| Variable         | Scope         | Type     | Default / Example    | Purpose                        |
| :--------------- | :------------ | :------- | :------------------- | :----------------------------- |
| `NODE_ENV`       | Server        | `enum`   | `"development"`      | Worker runtime environment     |
| `REDIS_HOST`     | Server        | `string` | `"127.0.0.1"`        | Redis host for BullMQ queues   |
| `REDIS_PORT`     | Server        | `number` | `6379`               | Redis port                     |
| `REDIS_PASSWORD` | Server Secret | `string` | `"veyora_redis_dev"` | Redis password                 |
| `CONCURRENCY`    | Server        | `number` | `5`                  | Maximum concurrent worker jobs |

---

## 3. Production Hardening Rules

When `NODE_ENV === "production"`, `apiEnvSchema.superRefine()` strictly rejects:

1. `JWT_ACCESS_SECRET` equaling `"veyora_jwt_access_secret_super_secure_32chars_min"`.
2. `JWT_REFRESH_SECRET` equaling `"veyora_jwt_refresh_secret_super_secure_32chars_min"`.
3. `COOKIE_SECRET` equaling `"veyora_secure_cookie_secret_dev_32chars"`.
4. Wildcard `CORS_ORIGIN === "*"`.
