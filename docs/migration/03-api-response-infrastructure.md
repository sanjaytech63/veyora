# Task 03 Migration Record: Express API Core Response Infrastructure & Error Middleware

**Status:** Completed and Verified  
**Branch:** `feature/backend-driven-notifications`  
**Workspace:** `apps/api`, `packages/utils`  
**Dependencies:** [02-shared-api-contracts.md](file:///c:/Users/Sanjay/Desktop/veyora/docs/migration/02-shared-api-contracts.md)  
**Date:** November 2026

---

## 1. Summary of Changes

Task 03 implemented the canonical backend-driven API response architecture and error middleware in `apps/api`. This integrates the shared contracts established in Task 02 into the active Express API infrastructure, establishing the backend as the single authoritative source for success outcomes, business error codes, validation details, and correlation IDs.

---

## 2. Files Modified and Created

| Workspace        | File Path                                           | Change Type  | Description                                                                                                                                                                               |
| :--------------- | :-------------------------------------------------- | :----------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/utils` | `src/errors.ts`                                     | **Modified** | Updated `AppError` constructor to accept both options object (`AppErrorOptions`) and legacy positional parameters.                                                                        |
| `apps/api`       | `src/types/express.d.ts`                            | **Modified** | Extended `Express.Request` interface with `requestId`, `rawBody`, and `log` (Pino child logger).                                                                                          |
| `apps/api`       | `src/middleware/request-id.ts`                      | **Modified** | Implemented safe request ID validation policy, UUID generation fallback, and binding to `req.id`, `req.requestId`, `req.log`, and `X-Request-Id` response header.                         |
| `apps/api`       | `src/utils/response.ts`                             | **Created**  | Implemented centralized `sendSuccess` response helper supporting both options object and positional parameter signatures.                                                                 |
| `apps/api`       | `src/middleware/error-handler.ts`                   | **Modified** | Standardized global error middleware to produce the canonical `ApiErrorResponse` envelope with correlation ID, internal error suppression, and transitional legacy compatibility.         |
| `apps/api`       | `src/middleware/rate-limiter.ts`                    | **Modified** | Standardized `apiRateLimiter` and specialized rate limiters (`auth`, `otp`, `refresh`, `payment`, `coupon`) to return canonical error envelopes with correlation IDs and HTTP 429 status. |
| `apps/api`       | `src/middleware/validate-request.ts`                | **Modified** | Standardized high-level validation message to `"Please review the submitted information."` while mapping nested Zod paths to `details`.                                                   |
| `apps/api`       | `src/__tests__/middleware.test.ts`                  | **Modified** | Updated validation assertion to align with standardized validation copy.                                                                                                                  |
| `apps/api`       | `src/__tests__/api-response-infrastructure.test.ts` | **Created**  | Comprehensive test suite covering all 25 success, error, rate-limit, correlation, and not-found requirements.                                                                             |

---

## 3. Reusable Success Response Helper (`sendSuccess`)

Location: [`apps/api/src/utils/response.ts`](file:///c:/Users/Sanjay/Desktop/veyora/apps/api/src/utils/response.ts)

### 3.1 Signatures

```typescript
export interface SendSuccessOptions<T = unknown> {
  statusCode?: number;
  code: string;
  message: string;
  data: T;
  meta?: Partial<ApiMeta> & {
    pagination?: ApiPaginationMeta;
    [key: string]: unknown;
  };
}

export function sendSuccess<T = unknown>(res: Response, options: SendSuccessOptions<T>): Response;
export function sendSuccess<T = unknown>(
  res: Response,
  data: T,
  message: string,
  code: string,
  meta?: Partial<ApiMeta>,
  statusCode?: number
): Response;
```

### 3.2 Canonical Output Example

```json
{
  "success": true,
  "code": "CART_ITEM_ADDED",
  "message": "Garment added to your shopping bag.",
  "data": {
    "itemCount": 2,
    "subtotal": 2500
  },
  "meta": {
    "requestId": "5e1f762a-89a7-4f67-8d02-124b890a56fe",
    "timestamp": "2026-11-25T14:30:00.000Z"
  }
}
```

---

## 4. Middleware Registration Order

Verified in [`apps/api/src/app.ts`](file:///c:/Users/Sanjay/Desktop/veyora/apps/api/src/app.ts):

```
1. app.set("trust proxy", 1)           ──> Behind reverse proxy in production
2. app.use(requestId)                  ──> Validates or generates x-request-id; binds to req.log
3. app.use(helmet(...))                ──> Security headers (CSP, CORS policy)
4. app.use(cors(...))                  ──> CORS origin checking and exposed header declaration
5. app.use(cookieParser(...))          ──> Cookie parsing
6. app.use(express.json({ verify }))   ──> Preserves req.rawBody for webhook verification
7. app.use(express.urlencoded(...))    ──> Form URL encoding
8. app.use(requestLogger)              ──> Pino HTTP structured logging
9. Health & System Metrics             ──> /health, /metrics (bypasses rate limiting)
10. app.use(apiRateLimiter)            ──> Global rate limiting on /api/v1
11. Route Handlers (apiV1Router)       ──> Auth, Catalog, Cart, Checkout, Payments, etc.
12. app.use(notFoundHandler)           ──> Creates NotFoundError for unknown endpoints
13. app.use(errorHandler)              ──> Global error handler registered last
```

---

## 5. Security & Diagnostic Guarantees

1. **Request ID Validation Policy:**
   - Incoming `x-request-id` header is verified against `/^[a-zA-Z0-9_\-.:]{1,64}$/`.
   - Any malformed, overly long, or non-whitelisted string is rejected and replaced with `crypto.randomUUID()`.
2. **Internal Server Error Suppression:**
   - Database crash messages (`MongoServerError`, `duplicate key`, `E11000`) are mapped to clean `CONFLICT` responses without leaking collection names or internal indexes.
   - Raw stack traces (`err.stack`) are logged to Pino internally but never sent to clients.
   - Bearer tokens, passwords, and OTP values are detected and masked.
3. **Webhook Preservation:**
   - Razorpay webhook verification relies on `req.rawBody`, which remains preserved by `express.json({ verify })` and verified in tests.

---

## 6. Verification and Test Results

### 6.1 Integration Tests

- `apps/api/src/__tests__/api-response-infrastructure.test.ts`: **25 / 25 tests passed** (142ms)
  - Success helper envelope, status code, code/message, request ID, pagination (Tests 1–6).
  - AppError normalization, Zod details, MongoDB duplicate key, CastError, 500 suppression, credentials masking (Tests 7–15).
  - Rate limiter response, 429 status, request ID, Retry-After header (Tests 16–19).
  - Request ID generation, validation, header reflection, metadata match (Tests 20–24).
  - Not-found handling (Test 25).
- `apps/api/src/__tests__/middleware.test.ts`: **7 / 7 tests passed** (57ms).
- `apps/api/src/__tests__/payment.test.ts`: **16 / 16 tests passed** (1.44s) — verified Razorpay raw-body webhook signature verification.
- `@veyora/utils`: **57 / 57 tests passed**.

### 6.2 TypeScript Compilation

```bash
npx tsc --noEmit -p apps/api
```

**Result:** Code exited with code 0 (zero errors).

---

## 7. Remaining Controller Migration Work (Future Tasks)

1. **Task 04:** Migrate Authentication controllers (`apps/api/src/modules/auth`) to consume `sendSuccess` and throw canonical `AppError` codes.
2. **Task 05:** Migrate Commerce controllers (Cart, Checkout, Coupons, Wishlist, Payments).
3. **Task 06:** Migrate Catalog, Inventory, Shipping, and RBAC governance controllers.
4. **Task 07:** Implement frontend `notify` UI adapter over Sonner in `apps/web` and `apps/admin`.
5. **Task 08:** Migrate frontend pages and hooks to consume backend messages.
