# Task 07 Migration Record: Wishlist & Customer Commerce — Backend-Driven Messages

**Status:** Completed and Verified  
**Branch:** `feature/backend-driven-notifications`  
**Workspace:** `apps/api`, `packages/types`, `packages/utils`  
**Dependencies:** [06-cart-controller-migration.md](file:///c:/Users/Sanjay/Desktop/veyora/docs/migration/06-cart-controller-migration.md)  
**Date:** November 2026

---

## 1. Summary of Changes

Task 07 migrated all Wishlist endpoints (`apps/api/src/modules/wishlist`) and customer delivery address endpoints (`apps/api/src/modules/checkout/address.router.ts`) to the canonical `sendSuccess` helper and standardized domain error codes. The Express API (`apps/api`) is now the authoritative single source of truth for wishlist management, customer address-book operations, stable machine-readable response codes, and patron ownership constraints.

Key guarantees delivered:

1. **Canonical Envelopes:** All 9 migrated endpoints use `sendSuccess` for success envelopes and canonical `ApiErrorResponse` via `AppError` for errors.
2. **Wishlist Operations:**
   - Full support for both guest sessions (`x-guest-id`) and authenticated patrons.
   - Idempotent additions (adding an already wishlisted product succeeds gracefully without duplication).
   - Inactive or draft product rejection (`PRODUCT_NOT_AVAILABLE`).
   - Strict patron isolation (User A cannot access User B's wishlist).
3. **Customer Commerce Addresses:**
   - Saved delivery address management (list, create, update, delete, set default).
   - Strict ownership protection (`CUSTOMER_ADDRESS_UNAUTHORIZED` if a patron or guest attempts to mutate another user's address).
   - Non-existent address rejection (`CUSTOMER_ADDRESS_NOT_FOUND`).
   - Default address mechanics (setting an address as default atomically unsets other addresses for that user/guest).
4. **Strict Domain Boundaries:** Checkout, orders, payments, inventory, and frontend toast components were untouched.

---

## 2. Files Modified and Created

| Workspace        | File Path                                                 | Change Type  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| :--------------- | :-------------------------------------------------------- | :----------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types` | `src/codes.ts`                                            | **Modified** | Added stable `ApiWishlistCode` (`WISHLIST_FETCHED`, `WISHLIST_ITEM_ADDED`, `WISHLIST_ITEM_REMOVED`, `WISHLIST_CLEARED`, `WISHLIST_ITEM_CHECKED`, `WISHLIST_NOT_FOUND`, `WISHLIST_ITEM_NOT_FOUND`, `WISHLIST_ITEM_ALREADY_EXISTS`, `WISHLIST_LIMIT_EXCEEDED`) and `ApiAddressCode` (`CUSTOMER_ADDRESSES_FETCHED`, `CUSTOMER_ADDRESS_CREATED`, `CUSTOMER_ADDRESS_UPDATED`, `CUSTOMER_ADDRESS_DELETED`, `CUSTOMER_DEFAULT_ADDRESS_UPDATED`, `CUSTOMER_ADDRESS_NOT_FOUND`, `CUSTOMER_ADDRESS_LIMIT_EXCEEDED`, `CUSTOMER_ADDRESS_UNAUTHORIZED`, `DEFAULT_ADDRESS_REQUIRED`, `INVALID_CUSTOMER_ADDRESS`). |
| `apps/api`       | `src/modules/wishlist/controllers/wishlist.controller.ts` | **Modified** | Migrated all 4 endpoints (`getWishlist`, `addItem`, `removeItem`, `clearWishlist`) to `sendSuccess`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `apps/api`       | `src/modules/wishlist/services/wishlist.service.ts`       | **Modified** | Attached domain codes to `NotFoundError` and `BadRequestError` exceptions (`WISHLIST_NOT_FOUND`, `PRODUCT_NOT_FOUND`, `PRODUCT_NOT_AVAILABLE`).                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `apps/api`       | `src/modules/checkout/controllers/address.controller.ts`  | **Modified** | Migrated all 5 endpoints (`listAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`) to `sendSuccess`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `apps/api`       | `src/modules/checkout/services/checkout.service.ts`       | **Modified** | Attached domain codes `CUSTOMER_ADDRESS_NOT_FOUND` and `CUSTOMER_ADDRESS_UNAUTHORIZED` to address mutations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `apps/api`       | `src/__tests__/wishlist.test.ts`                          | **Modified** | Expanded tests (9 tests) verifying canonical success envelopes, codes, messages, patron isolation, and inactive product rejection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `apps/api`       | `src/__tests__/checkout.test.ts`                          | **Modified** | Updated address management tests (19 total tests in suite) verifying canonical codes, default address setting, 404 on non-existent address, and unauthorized access rejection.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `docs/migration` | `07-wishlist-customer-commerce-migration.md`              | **Created**  | Architecture migration record and reference documentation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

---

## 3. Migrated Endpoints Reference

### A. Wishlist Domain

| HTTP Method & Route                        |    Status     | Stable Response Code    | Backend Copy Message                          | Notes                                           |
| :----------------------------------------- | :-----------: | :---------------------- | :-------------------------------------------- | :---------------------------------------------- |
| `GET /api/v1/wishlist`                     |   `200 OK`    | `WISHLIST_FETCHED`      | `"Wishlist retrieved successfully."`          | Supports guest session and authenticated patron |
| `POST /api/v1/wishlist/items`              | `201 Created` | `WISHLIST_ITEM_ADDED`   | `"Garment saved to personal collection."`     | Idempotent duplicate addition; checks status    |
| `DELETE /api/v1/wishlist/items/:productId` |   `200 OK`    | `WISHLIST_ITEM_REMOVED` | `"Garment removed from personal collection."` | Removes product from personal collection        |
| `DELETE /api/v1/wishlist`                  |   `200 OK`    | `WISHLIST_CLEARED`      | `"Personal collection cleared successfully."` | Clears all items                                |

### B. Customer Addresses Domain

| HTTP Method & Route                          |    Status     | Stable Response Code               | Backend Copy Message                  | Notes                                  |
| :------------------------------------------- | :-----------: | :--------------------------------- | :------------------------------------ | :------------------------------------- |
| `GET /api/v1/addresses`                      |   `200 OK`    | `CUSTOMER_ADDRESSES_FETCHED`       | `"Addresses retrieved successfully."` | Lists saved customer addresses         |
| `POST /api/v1/addresses`                     | `201 Created` | `CUSTOMER_ADDRESS_CREATED`         | `"Address created successfully."`     | Creates address; sets default if first |
| `PUT /api/v1/addresses/:addressId`           |   `200 OK`    | `CUSTOMER_ADDRESS_UPDATED`         | `"Address updated successfully."`     | Enforces ownership                     |
| `DELETE /api/v1/addresses/:addressId`        |   `200 OK`    | `CUSTOMER_ADDRESS_DELETED`         | `"Address deleted successfully."`     | Deletes address; enforces ownership    |
| `PATCH /api/v1/addresses/:addressId/default` |   `200 OK`    | `CUSTOMER_DEFAULT_ADDRESS_UPDATED` | `"Default address set successfully."` | Atomically unsets other defaults       |

---

## 4. Error Code Reference

| Domain Error Code               |     HTTP Status     | Description                                                       |
| :------------------------------ | :-----------------: | :---------------------------------------------------------------- |
| `WISHLIST_NOT_FOUND`            |  `400 Bad Request`  | Missing both `userId` and `guestId` identifier                    |
| `PRODUCT_NOT_AVAILABLE`         |   `404 Not Found`   | Target garment does not exist or is not active                    |
| `CUSTOMER_ADDRESS_NOT_FOUND`    |   `404 Not Found`   | Address ID does not exist in database                             |
| `CUSTOMER_ADDRESS_UNAUTHORIZED` |  `400 Bad Request`  | Caller is not authorized to edit or delete the specified address  |
| `VALIDATION_ERROR`              | `422 Unprocessable` | Missing required address fields (street, city, state, postalCode) |

---

## 5. Verification & Testing

- **Wishlist Integration Tests:** 9/9 passing in `apps/api/src/__tests__/wishlist.test.ts`.
- **Checkout & Address Tests:** 19/19 passing in `apps/api/src/__tests__/checkout.test.ts`.
- **Cross-Domain Regression Suite:** 88/88 passing across `wishlist.test.ts` (9), `cart.test.ts` (22), `catalog.test.ts` (29), and `auth.test.ts` (28).
- **TypeScript Strict Typecheck:** Monorepo packages `@veyora/types`, `@veyora/utils`, and `@veyora/api` compile cleanly with zero errors.
