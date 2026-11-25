# Task 06 Migration Record: Cart API — Backend-Driven Messages

**Status:** Completed and Verified  
**Branch:** `feature/backend-driven-notifications`  
**Workspace:** `apps/api`, `packages/types`, `packages/utils`  
**Dependencies:** [05-product-catalog-controller-migration.md](file:///c:/Users/Sanjay/Desktop/veyora/docs/migration/05-product-catalog-controller-migration.md)  
**Date:** November 2026

---

## 1. Summary of Changes

Task 06 migrated all Cart endpoints in `apps/api/src/modules/cart` to the canonical `sendSuccess` helper and standardized domain error codes. The Express API (`apps/api`) is now the authoritative single source of truth for all cart-related operation messages, stable machine-readable codes, server-calculated totals, and stock validation errors.

Key guarantees delivered:

1. **Canonical Envelopes:** All 8 cart endpoints use `sendSuccess` for success envelopes and canonical `ApiErrorResponse` via `AppError` for errors.
2. **Server-Authoritative Pricing & Totals:** Product unit prices are strictly retrieved from server database records; spoofed client prices are ignored. Subtotal, discounts, shipping fees, estimated tax, and free-shipping thresholds are recalculated on the server.
3. **Guest & Authenticated Cart Isolation:** Guest sessions use `x-guest-id` headers or cookies. Authenticated users are isolated by their verified JWT claims and session records. User A cannot read or modify User B's cart.
4. **Stock Validation & Domain Codes:**
   - `INSUFFICIENT_STOCK` (409 Conflict) when requested quantity exceeds available on-hand stock.
   - `PRODUCT_OUT_OF_STOCK` (409 Conflict) when available stock is zero.
   - `PRODUCT_NOT_AVAILABLE` (404 Not Found) when a product is missing, draft, or inactive.
   - `INVALID_PRODUCT_VARIANT` (400 Bad Request) when variant identifier is invalid.
   - `CART_ITEM_NOT_FOUND` (404 Not Found) when modifying non-existent cart items.
   - `COUPON_INVALID` (400 Bad Request) for invalid or expired promotional codes.
5. **Client Bulk Synchronization:** `/cart/sync` bulk-synchronizes client items, clamps quantities to available inventory, and resolves server pricing.
6. **Strict Domain Boundaries:** Wishlist, checkout, orders, payments, product/catalog controllers, and frontend toast components were untouched.

---

## 2. Files Modified and Created

| Workspace        | File Path                                         | Change Type  | Description                                                                                                                                                                                                                                                                                                                                                                   |
| :--------------- | :------------------------------------------------ | :----------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types` | `src/codes.ts`                                    | **Modified** | Added stable `ApiCommerceCode` domain codes for cart success operations and errors (`CART_FETCHED`, `CART_ITEM_ADDED`, `CART_ITEM_UPDATED`, `CART_ITEM_REMOVED`, `CART_CLEARED`, `CART_SYNCED`, `CART_MERGED`, `CART_VALIDATED`, `CART_NOT_FOUND`, `CART_ITEM_NOT_FOUND`, `PRODUCT_NOT_AVAILABLE`, `INVALID_CART_QUANTITY`, `CART_ITEM_LIMIT_EXCEEDED`, `CART_MERGE_FAILED`). |
| `apps/api`       | `src/modules/cart/controllers/cart.controller.ts` | **Modified** | Migrated all 8 endpoints (`getCart`, `addItem`, `updateQuantity`, `removeItem`, `clearCart`, `applyCoupon`, `removeCoupon`, `syncCart`) to `sendSuccess`.                                                                                                                                                                                                                     |
| `apps/api`       | `src/modules/cart/services/cart.service.ts`       | **Modified** | Attached domain codes to `NotFoundError`, `ConflictError`, and `BadRequestError` exceptions (`CART_NOT_FOUND`, `PRODUCT_NOT_FOUND`, `PRODUCT_NOT_AVAILABLE`, `INVALID_PRODUCT_VARIANT`, `INSUFFICIENT_STOCK`, `PRODUCT_OUT_OF_STOCK`, `CART_ITEM_NOT_FOUND`, `COUPON_INVALID`).                                                                                               |
| `apps/api`       | `src/__tests__/cart.test.ts`                      | **Modified** | Expanded integration tests (22 tests) to assert canonical envelopes, stable codes, backend messages, user isolation, stock validation, and bulk sync behavior.                                                                                                                                                                                                                |
| `docs/migration` | `06-cart-controller-migration.md`                 | **Created**  | Architecture migration record and reference documentation.                                                                                                                                                                                                                                                                                                                    |

---

## 3. Migrated Cart Endpoint Reference

| HTTP Method & Route                 |    Status     | Stable Response Code | Backend Copy Message                                 | Notes                                           |
| :---------------------------------- | :-----------: | :------------------- | :--------------------------------------------------- | :---------------------------------------------- |
| `GET /api/v1/cart`                  |   `200 OK`    | `CART_FETCHED`       | `"Shopping cart retrieved successfully."`            | Supports guest session and authenticated patron |
| `POST /api/v1/cart/items`           | `201 Created` | `CART_ITEM_ADDED`    | `"Garment added to shopping bag."`                   | Validates stock, resolves variant price         |
| `PATCH /api/v1/cart/items/:itemId`  |   `200 OK`    | `CART_ITEM_UPDATED`  | `"Bag item quantity updated successfully."`          | Qty 0 removes item; validates stock             |
| `DELETE /api/v1/cart/items/:itemId` |   `200 OK`    | `CART_ITEM_REMOVED`  | `"Garment removed from shopping bag."`               | Removes single item                             |
| `DELETE /api/v1/cart`               |   `200 OK`    | `CART_CLEARED`       | `"Shopping bag cleared successfully."`               | Clears all items and resets coupon              |
| `POST /api/v1/cart/coupon`          |   `200 OK`    | `COUPON_APPLIED`     | `"Promotional privilege code applied successfully."` | Recalculates discount and totals                |
| `DELETE /api/v1/cart/coupon`        |   `200 OK`    | `COUPON_REMOVED`     | `"Coupon removed successfully."`                     | Removes coupon code and discount                |
| `POST /api/v1/cart/sync`            |   `200 OK`    | `CART_SYNCED`        | `"Shopping bag synchronized successfully."`          | Bulk syncs client items, clamps quantities      |

---

## 4. Error Code Reference

| Domain Error Code         |     HTTP Status     | Description                                                     |
| :------------------------ | :-----------------: | :-------------------------------------------------------------- |
| `CART_NOT_FOUND`          |  `400 Bad Request`  | Missing both `userId` and `guestId` identifier                  |
| `PRODUCT_NOT_FOUND`       |   `404 Not Found`   | Product ID is not a valid MongoDB ObjectId                      |
| `PRODUCT_NOT_AVAILABLE`   |   `404 Not Found`   | Product does not exist or status is not active (draft/archived) |
| `INVALID_PRODUCT_VARIANT` |  `400 Bad Request`  | Specified variant ID or SKU does not exist on product           |
| `INSUFFICIENT_STOCK`      |   `409 Conflict`    | Requested quantity exceeds available on-hand stock              |
| `PRODUCT_OUT_OF_STOCK`    |   `409 Conflict`    | Product or variant has 0 available units in inventory           |
| `CART_ITEM_NOT_FOUND`     |   `404 Not Found`   | Item ID does not exist in target cart                           |
| `VALIDATION_ERROR`        | `422 Unprocessable` | Invalid quantity (e.g. negative number) or schema violation     |
| `COUPON_INVALID`          |  `400 Bad Request`  | Coupon code does not exist, expired, or ineligible              |

---

## 5. Verification & Testing

- **Cart Integration Tests:** 22/22 passing in `apps/api/src/__tests__/cart.test.ts`.
- **Cross-Domain Tests:** 79/79 tests passing across `cart.test.ts` (22), `catalog.test.ts` (29), and `auth.test.ts` (28).
- **TypeScript Strict Typecheck:** Monorepo packages `@veyora/types`, `@veyora/utils`, and `@veyora/api` compile cleanly with zero errors.
