# Task 08 Migration Record: Checkout & Orders API — Backend-Driven Messages

**Status:** Completed and Verified  
**Branch:** `feature/backend-driven-notifications`  
**Workspace:** `apps/api`, `packages/types`, `packages/utils`  
**Dependencies:** [07-wishlist-customer-commerce-migration.md](file:///c:/Users/Sanjay/Desktop/veyora/docs/migration/07-wishlist-customer-commerce-migration.md)  
**Date:** November 2026

---

## 1. Summary of Changes

Task 08 migrated all Checkout and Orders endpoints (`apps/api/src/modules/checkout/checkout.router.ts`, `controllers/checkout.controller.ts`, and `services/checkout.service.ts`) to the canonical `sendSuccess` helper and standardized machine-readable error codes. The Express API (`apps/api`) is now the authoritative single source of truth for checkout validation, order placement, order query, and strict order lifecycle governance.

Key guarantees delivered:

1. **Canonical Envelopes:** All 9 migrated endpoints use `sendSuccess` for success envelopes and canonical `ApiErrorResponse` via `AppError` for errors.
2. **Checkout Validation & Commercial Pricing Integrity:**
   - Server-authoritative calculation for subtotals, promotional discounts, tiered shipping methods, and taxes.
   - Live variant stock and catalog status checks before order confirmation.
   - Client price and calculation tampering rejected.
3. **Idempotency & Concurrency Protections:**
   - Deduplication via `idempotencyKey` prevents duplicate orders on network retries or double-submissions.
   - Stock reservations are logged in `StockMovement` and only decremented/reserved once.
4. **Strict Order Lifecycle State Machine:**
   - Enforces transition path: `pending` -> `confirmed` -> `processing` -> `shipped` -> `delivered`.
   - Customer cancellation permitted only during `pending` and `confirmed` states.
   - Admin cancellations release reserved stock and record audit telemetry in `statusHistory`.
   - Terminal states (`cancelled`, `refunded`) reject arbitrary mutations (`ORDER_STATUS_INVALID`).
5. **Customer Access Protection (IDOR Prevention):**
   - Patron ownership checks ensure customers can only query or cancel their own orders. Cross-customer access attempts return 404 `ORDER_NOT_FOUND`.
6. **Payment Boundary Strictly Preserved:**
   - Razorpay controllers, signatures, webhooks, and payment verifications remained untouched and out of scope for Task 08.

---

## 2. Files Modified and Created

| Workspace        | File Path                                                 | Change Type  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| :--------------- | :-------------------------------------------------------- | :----------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types` | `src/codes.ts`                                            | **Modified** | Added stable `ApiCheckoutCode` (`CHECKOUT_SUMMARY_FETCHED`, `CHECKOUT_VALIDATED`, `CHECKOUT_ORDER_CREATED`, `CHECKOUT_ADDRESS_VALIDATED`, `CHECKOUT_COUPON_VALIDATED`, `CHECKOUT_VALIDATION_FAILED`, `CHECKOUT_ADDRESS_REQUIRED`, `CHECKOUT_ADDRESS_INVALID`, `CHECKOUT_CART_EMPTY`, `CHECKOUT_PRODUCT_UNAVAILABLE`, `CHECKOUT_INSUFFICIENT_STOCK`, `CHECKOUT_COUPON_INVALID`, `CHECKOUT_PRICE_CHANGED`) and `ApiOrderCode` (`ORDERS_FETCHED`, `ORDER_FETCHED`, `ORDER_CREATED`, `ORDER_CANCELLED`, `ORDER_STATUS_UPDATED`, `ORDER_TRACKING_FETCHED`, `ORDER_RETURN_REQUESTED`, `ADMIN_ORDERS_FETCHED`, `ADMIN_ORDER_FETCHED`, `ORDER_NOT_FOUND`, `ORDER_ACCESS_DENIED`, `ORDER_CANNOT_BE_CANCELLED`, `ORDER_STATUS_INVALID`, `ORDER_ALREADY_CANCELLED`, `ORDER_ALREADY_PROCESSED`, `ORDER_RETURN_NOT_ALLOWED`). Rebuilt `@veyora/types`. |
| `apps/api`       | `src/modules/checkout/controllers/checkout.controller.ts` | **Modified** | Migrated all 9 methods (`validateCheckout`, `createOrder`, `getOrder`, `listOrders`, `cancelOrder`, `adminListOrders`, `adminGetOrder`, `adminUpdateOrderStatus`, `adminCancelOrder`) to `sendSuccess`. Preserved `PaginatedOrdersDto` compatibility in `data` while adding envelope `meta`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `apps/api`       | `src/modules/checkout/services/checkout.service.ts`       | **Modified** | Attached domain codes to `BadRequestError`, `ConflictError`, and `NotFoundError` throws (`CHECKOUT_CART_EMPTY`, `CHECKOUT_PRODUCT_UNAVAILABLE`, `CHECKOUT_INSUFFICIENT_STOCK`, `ORDER_NOT_FOUND`, `ORDER_STATUS_INVALID`, `ORDER_CANNOT_BE_CANCELLED`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `apps/api`       | `src/__tests__/checkout.test.ts`                          | **Modified** | Enhanced tests to verify canonical envelope codes, messages, and calculations for checkout validation, order placement, idempotency, empty bag rejection, out-of-stock conflict, and IDOR protection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `apps/api`       | `src/__tests__/order-lifecycle.test.ts`                   | **Modified** | Enhanced tests verifying canonical codes on status transitions (`ORDER_STATUS_UPDATED`), invalid transition rejection (`ORDER_STATUS_INVALID`), customer cancellation (`ORDER_CANCELLED`), post-dispatch cancellation rejection (`ORDER_CANNOT_BE_CANCELLED`), and admin listing pagination metadata (`ADMIN_ORDERS_FETCHED`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `docs/migration` | `08-checkout-orders-controller-migration.md`              | **Created**  | Architecture migration record and reference documentation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

---

## 3. Migrated Endpoints Reference

### A. Checkout & Storefront Orders Domain

| HTTP Method & Route                                            |    Status     | Stable Response Code | Backend Copy Message                 | Notes                                                    |
| :------------------------------------------------------------- | :-----------: | :------------------- | :----------------------------------- | :------------------------------------------------------- |
| `GET /api/v1/checkout/validate`                                |   `200 OK`    | `CHECKOUT_VALIDATED` | `"Checkout validated successfully."` | Validates cart items, stock, shipping options, and taxes |
| `POST /api/v1/checkout/orders`                                 | `201 Created` | `ORDER_CREATED`      | `"Order placed successfully."`       | Creates order, reserves stock, clears active cart        |
| `GET /api/v1/orders`                                           |   `200 OK`    | `ORDERS_FETCHED`     | `"Orders retrieved successfully."`   | Lists orders for patron or guest                         |
| `GET /api/v1/orders/:orderId`<br>`/api/v1/checkout/orders/:id` |   `200 OK`    | `ORDER_FETCHED`      | `"Order retrieved successfully."`    | Fetches single order; enforces IDOR ownership            |
| `POST /api/v1/orders/:orderId/cancel`                          |   `200 OK`    | `ORDER_CANCELLED`    | `"Order cancelled successfully."`    | Cancels order if pending/confirmed; releases inventory   |

### B. Administrator Order Governance Domain

| HTTP Method & Route                          |  Status  | Stable Response Code   | Backend Copy Message                       | Notes                                                  |
| :------------------------------------------- | :------: | :--------------------- | :----------------------------------------- | :----------------------------------------------------- |
| `GET /api/v1/admin/orders`                   | `200 OK` | `ADMIN_ORDERS_FETCHED` | `"Admin orders retrieved successfully."`   | Paginated list with search, status filters, and `meta` |
| `GET /api/v1/admin/orders/:orderId`          | `200 OK` | `ADMIN_ORDER_FETCHED`  | `"Admin order retrieved successfully."`    | Full administrative order detail                       |
| `PATCH /api/v1/admin/orders/:orderId/status` | `200 OK` | `ORDER_STATUS_UPDATED` | `` `Order status updated to ${status}.` `` | Validates state machine transition & updates tracking  |
| `POST /api/v1/admin/orders/:orderId/cancel`  | `200 OK` | `ORDER_CANCELLED`      | `"Order cancelled by administrator."`      | Admin cancellation with inventory release              |

---

## 4. Error Code Reference

| Domain Error Code              |  HTTP Status  | Trigger Condition                                                                       |
| :----------------------------- | :-----------: | :-------------------------------------------------------------------------------------- |
| `CHECKOUT_CART_EMPTY`          |     `400`     | Patron attempts checkout with zero active cart items.                                   |
| `CHECKOUT_PRODUCT_UNAVAILABLE` | `400` / `409` | A product or variant in the cart is inactive, missing, or zero stock.                   |
| `CHECKOUT_INSUFFICIENT_STOCK`  |     `409`     | Requested quantity exceeds remaining available inventory stock.                         |
| `VALIDATION_ERROR`             |     `422`     | Checkout payload missing required delivery address, customer email, or shipping method. |
| `ORDER_NOT_FOUND`              |     `404`     | Order identifier does not exist or belongs to another patron (IDOR protection).         |
| `ORDER_STATUS_INVALID`         |     `400`     | Admin attempts an unauthorized status transition (e.g. pending -> delivered).           |
| `ORDER_CANNOT_BE_CANCELLED`    |     `400`     | Order has already been shipped, delivered, or terminal cancelled.                       |
| `FORBIDDEN`                    |     `403`     | Non-admin user attempts access to `/api/v1/admin/orders`.                               |

---

## 5. Verification Commands & Results

1. **Focused Test Suites:**

   ```bash
   npm run test --workspace=@veyora/api -- src/__tests__/checkout.test.ts src/__tests__/order-lifecycle.test.ts
   ```
   - **Result:** **30 / 30 tests passed** (19 checkout/address tests + 11 order lifecycle tests).

2. **Cross-Domain Regression Suite:**

   ```bash
   npm run test --workspace=@veyora/api -- src/__tests__/checkout.test.ts src/__tests__/order-lifecycle.test.ts src/__tests__/cart.test.ts src/__tests__/wishlist.test.ts src/__tests__/catalog.test.ts src/__tests__/auth.test.ts
   ```
   - **Result:** **118 / 118 tests passed** across all 6 migrated domain test files.

3. **Strict TypeScript Typecheck:**
   ```bash
   npx tsc --noEmit -p apps/api/tsconfig.json
   ```
   - **Result:** **0 errors**.
