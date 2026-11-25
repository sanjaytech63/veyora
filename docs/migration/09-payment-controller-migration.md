# Task 09 Migration Record: Razorpay Payments API — Backend-Driven Messages

**Status:** Completed and Verified  
**Branch:** `feature/backend-driven-notifications`  
**Workspace:** `apps/api`, `packages/types`, `packages/utils`  
**Dependencies:** [08-checkout-orders-controller-migration.md](file:///c:/Users/Sanjay/Desktop/veyora/docs/migration/08-checkout-orders-controller-migration.md)  
**Date:** November 2026

---

## 1. Summary of Changes

Task 09 migrated all Express Payment endpoints (`apps/api/src/modules/payment`) to the canonical `sendSuccess` helper and standardized machine-readable error codes. The Express API (`apps/api`) is now the authoritative single source of truth for payment order initiation, cryptographic signature verification, payment retry, payment status inspection, refund processing, and signed webhook ingest.

Key guarantees delivered:

1. **Canonical Envelopes:** All normal payment API endpoints use `sendSuccess` for success envelopes and canonical `ApiErrorResponse` via `AppError` for errors.
2. **Protocol-Specific Webhook Compliance:**
   - Webhook acknowledgements return `{ status: "ok", success: true, code: "...", message: "..." }` with HTTP 200 to adhere to Razorpay delivery semantics.
   - Raw request body parsing is strictly preserved for HMAC-SHA256 signature validation.
   - Unauthenticated/tampered webhooks return HTTP 401 with `PAYMENT_WEBHOOK_SIGNATURE_INVALID`.
3. **Cryptographic Payment Verification & Security Controls:**
   - Client payment success callbacks are never accepted without server-side HMAC-SHA256 signature verification using the server secret (`RAZORPAY_KEY_SECRET`).
   - Order totals are strictly server-authoritative; client price tampering is impossible.
   - Mismatched or tampered signatures transition the payment status to `failed` and reject the request with `PAYMENT_SIGNATURE_INVALID`, leaving the order in `pending`.
4. **Idempotency & Duplicate Protection:**
   - Webhooks extract and record `eventId` in `WebhookEvent`; duplicate deliveries are acknowledged with `PAYMENT_WEBHOOK_IGNORED` and `duplicate: true` without duplicating order state transitions or emails.
   - Payment initiation checks for already settled payments (`PAYMENT_ALREADY_SETTLED`).
5. **Refund Integrity:**
   - Admin refunds validate against the captured payment amount and remaining balance. Over-refund attempts are rejected with `REFUND_ALREADY_PROCESSED`.
   - Partial refunds transition the payment to `partially_refunded`. Full refunds transition both payment and order to `refunded`.
6. **Patron Isolation & IDOR Protection:**
   - Payment initiation, verification, and status retrieval enforce patron ownership (`req.user.id` or `x-guest-id`). Cross-customer inspection returns `404 ORDER_NOT_FOUND`.

---

## 2. Files Modified and Created

| Workspace        | File Path                                               | Change Type  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| :--------------- | :------------------------------------------------------ | :----------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types` | `src/codes.ts`                                          | **Modified** | Expanded `ApiPaymentCode` with `PAYMENT_ORDER_CREATED`, `PAYMENT_RETRY_INITIATED`, `PAYMENT_STATUS_FETCHED`, `PAYMENT_DETAILS_FETCHED`, `PAYMENT_WEBHOOK_PROCESSED`, `PAYMENT_WEBHOOK_IGNORED`, `REFUND_CREATED`, `REFUND_PROCESSED`, `PAYMENT_NOT_FOUND`, `PAYMENT_ORDER_CREATION_FAILED`, `PAYMENT_SIGNATURE_INVALID`, `PAYMENT_ALREADY_SETTLED`, `PAYMENT_WEBHOOK_SIGNATURE_INVALID`, `REFUND_ALREADY_PROCESSED`, etc. Rebuilt `@veyora/types`. |
| `apps/api`       | `src/modules/payment/controllers/payment.controller.ts` | **Modified** | Migrated all methods (`initiatePayment`, `verifyPayment`, `retryPayment`, `getPaymentStatus`, `handleRazorpayWebhook`, `adminRefundPayment`) to canonical response envelopes while preserving protocol-specific webhook delivery semantics.                                                                                                                                                                                                        |
| `apps/api`       | `src/modules/payment/services/payment.service.ts`       | **Modified** | Attached domain codes to `BadRequestError`, `ConflictError`, `NotFoundError`, and `UnauthorizedError` exceptions (`PAYMENT_ORDER_CREATION_FAILED`, `PAYMENT_ALREADY_SETTLED`, `PAYMENT_NOT_FOUND`, `PAYMENT_SIGNATURE_INVALID`, `PAYMENT_WEBHOOK_SIGNATURE_INVALID`, `REFUND_ALREADY_PROCESSED`, `ORDER_NOT_FOUND`).                                                                                                                               |
| `apps/api`       | `src/__tests__/payment.test.ts`                         | **Modified** | Enhanced test suite (16 tests) asserting canonical envelope codes, messages, idempotency flags, and error codes across initiation, verification, retries, webhooks, and refunds.                                                                                                                                                                                                                                                                   |
| `docs/migration` | `09-payment-controller-migration.md`                    | **Created**  | Architecture migration record and reference documentation.                                                                                                                                                                                                                                                                                                                                                                                         |

---

## 3. Migrated Endpoints Reference

### A. Storefront & Customer Payment Domain

| HTTP Method & Route                    |  Status  | Stable Response Code      | Backend Copy Message                        | Notes                                                      |
| :------------------------------------- | :------: | :------------------------ | :------------------------------------------ | :--------------------------------------------------------- |
| `POST /api/v1/payments/initiate`       | `200 OK` | `PAYMENT_ORDER_CREATED`   | `"Payment order initiated successfully."`   | Creates gateway order from server-authoritative total      |
| `POST /api/v1/payments/verify`         | `200 OK` | `PAYMENT_VERIFIED`        | `"Payment verified successfully."`          | Cryptographically verifies HMAC signature; confirms order  |
| `POST /api/v1/payments/retry`          | `200 OK` | `PAYMENT_RETRY_INITIATED` | `"Payment retry initiated successfully."`   | Re-initiates order payment and increments attempt counter  |
| `GET /api/v1/payments/status/:orderId` | `200 OK` | `PAYMENT_DETAILS_FETCHED` | `"Payment details retrieved successfully."` | Fetches payment details and refunds; enforces patron check |

### B. Webhooks (Idempotent & Provider-Compliant)

| HTTP Method & Route                      |  Status  | Stable Response Code        | Response Shape                                                    | Notes                                            |
| :--------------------------------------- | :------: | :-------------------------- | :---------------------------------------------------------------- | :----------------------------------------------- |
| `POST /api/v1/payments/webhook/razorpay` | `200 OK` | `PAYMENT_WEBHOOK_PROCESSED` | `{ status: "ok", success: true, code, message }`                  | Validates HMAC signature against raw body        |
| `POST /api/v1/payments/webhook/razorpay` | `200 OK` | `PAYMENT_WEBHOOK_IGNORED`   | `{ status: "ok", success: true, code, message, duplicate: true }` | Idempotent ACK for previously processed event ID |

### C. Administrator Refund Governance

| HTTP Method & Route                           |  Status  | Stable Response Code | Backend Copy Message               | Notes                                                    |
| :-------------------------------------------- | :------: | :------------------- | :--------------------------------- | :------------------------------------------------------- |
| `POST /api/v1/admin/payments/:orderId/refund` | `200 OK` | `REFUND_PROCESSED`   | `"Refund processed successfully."` | Partial or full refund; reconciles order & payment state |

---

## 4. Error Code Reference

| Domain Error Code                   | HTTP Status | Trigger Condition                                                                    |
| :---------------------------------- | :---------: | :----------------------------------------------------------------------------------- |
| `ORDER_NOT_FOUND`                   |    `404`    | Order does not exist or caller fails patron ownership check (IDOR protection).       |
| `PAYMENT_ORDER_CREATION_FAILED`     |    `400`    | Cannot initiate payment for order in terminal status (`cancelled`, `refunded`).      |
| `PAYMENT_ALREADY_SETTLED`           |    `409`    | Order already has an existing successful settlement record.                          |
| `PAYMENT_NOT_FOUND`                 |    `404`    | Target payment record not found for gateway order ID or order ID.                    |
| `PAYMENT_SIGNATURE_INVALID`         |    `400`    | Cryptographic HMAC-SHA256 signature verification failed.                             |
| `PAYMENT_WEBHOOK_SIGNATURE_INVALID` |    `401`    | Webhook HMAC-SHA256 signature mismatch against raw request body.                     |
| `REFUND_CREATION_FAILED`            |    `400`    | Payment record missing gateway payment ID or provider refund rejection.              |
| `REFUND_ALREADY_PROCESSED`          |    `400`    | Order has already been fully refunded or requested refund exceeds remaining balance. |
| `FORBIDDEN`                         |    `403`    | Non-admin caller attempts access to `/api/v1/admin/payments/:orderId/refund`.        |

---

## 5. Verification Commands & Results

1. **Focused Payment Test Suite:**

   ```bash
   npm run test --workspace=@veyora/api -- src/__tests__/payment.test.ts
   ```
   - **Result:** **16 / 16 tests passed**.

2. **Full Cross-Domain Regression Suite:**

   ```bash
   npm run test --workspace=@veyora/api -- src/__tests__/payment.test.ts src/__tests__/checkout.test.ts src/__tests__/order-lifecycle.test.ts src/__tests__/cart.test.ts src/__tests__/wishlist.test.ts src/__tests__/catalog.test.ts src/__tests__/auth.test.ts
   ```
   - **Result:** **134 / 134 tests passed** across all 7 migrated domain test files with 0 regressions.

3. **Strict TypeScript Typecheck:**
   ```bash
   npx tsc --noEmit -p apps/api/tsconfig.json
   ```
   - **Result:** **0 errors**.
