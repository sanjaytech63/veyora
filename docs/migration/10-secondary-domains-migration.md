# Task 10 Migration Record: Secondary Backend Domains — Backend-Driven Messages

**Status:** Completed and Verified  
**Branch:** `feature/backend-driven-notifications`  
**Workspace:** `apps/api`, `packages/types`, `packages/utils`  
**Dependencies:** [09-payment-controller-migration.md](file:///c:/Users/Sanjay/Desktop/veyora/docs/migration/09-payment-controller-migration.md)  
**Date:** November 2026

---

## 1. Summary of Changes

Task 10 migrated all secondary Express API modules to the canonical `sendSuccess` helper and standardized machine-readable error codes. The Express API (`apps/api`) is now the authoritative single source of truth for:

1. **Coupons & Promotions Domain (`apps/api/src/modules/coupon`):**
   - Customer discount validation against cart items, percentage calculation, discount caps, minimum order spends, expiry dates, and per-customer limits.
   - Administrator coupon lifecycle management (creation, listing, lookup, update, active/inactive toggle, deletion, and analytics).
2. **Customer Profile Domain (`apps/api/src/modules/profile`):**
   - Authenticated user profile retrieval, safe field allowlist updates, profile completion calculation, signed Cloudinary avatar upload parameter generation, avatar attachment, and avatar deletion.
   - Preserves strict role and permission tamper resistance.
3. **Product Reviews & Ratings Domain (`apps/api/src/modules/review`):**
   - Customer review submission with verified purchase detection, single review per customer per garment rule enforcement, rating summary calculation, star breakdown, and helpful vote recording.
   - Administrator review moderation (list, detail lookup, approval/rejection with reason, permanent deletion).
4. **Shipping & Fulfillment Domain (`apps/api/src/modules/shipping`):**
   - Real-time rate calculation across shipping zones with free shipping thresholds, public AWB tracking, and order shipment lookups.
   - Administrator fulfillment (manifesting shipments, updating tracking lifecycle events, shipping zones, and shipping methods).
5. **Customer Notifications Domain (`apps/api/src/modules/notification`):**
   - Customer in-app notification list retrieval with pagination and unread counts, single notification lookup, mark as read, mark as unread, mark all as read, and single notification deletion.
   - Enforces strict user isolation and IDOR protection.

---

## 2. Files Modified and Created

| Workspace           | File Path                                                         | Change Type  | Description                                                                                                                                                                                                                                                                                                           |
| :------------------ | :---------------------------------------------------------------- | :----------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types`    | `src/codes.ts`                                                    | **Modified** | Added stable response code catalogs: `ApiCouponCode`, `ApiProfileCode`, `ApiReviewCode`, `ApiShippingCode`, and `ApiNotificationCode`, aggregated into `ApiResponseCode`. Rebuilt `@veyora/types`.                                                                                                                    |
| `apps/api`          | `src/utils/response.ts`                                           | **Modified** | Safeguarded `res.getHeader` invocation with optional chaining and function existence checks to prevent crashes when invoked with mock response objects in unit tests.                                                                                                                                                 |
| `apps/api`          | `src/modules/coupon/controllers/coupon.controller.ts`             | **Modified** | Migrated all controller endpoints (`validateCoupon`, `listCoupons`, `getCouponById`, `createCoupon`, `updateCoupon`, `toggleCouponStatus`, `deleteCoupon`, `getCouponAnalytics`) to `sendSuccess`.                                                                                                                    |
| `apps/api`          | `src/modules/coupon/services/coupon.service.ts`                   | **Modified** | Attached domain-specific codes to all `BadRequestError`, `NotFoundError`, and `ConflictError` exceptions (`COUPON_NOT_FOUND`, `COUPON_INACTIVE`, `COUPON_EXPIRED`, `COUPON_USAGE_LIMIT_EXCEEDED`, `COUPON_CUSTOMER_LIMIT_EXCEEDED`, `COUPON_NOT_APPLICABLE`, `COUPON_MINIMUM_SPEND_NOT_MET`, `COUPON_CODE_CONFLICT`). |
| `apps/api`          | `src/modules/profile/profile.controller.ts`                       | **Modified** | Migrated all self-service endpoints (`getProfile`, `updateProfile`, `getAvatarUploadSignature`, `updateAvatar`, `removeAvatar`, `getProfileCompletion`) to `sendSuccess` while maintaining legacy top-level timestamp compatibility.                                                                                  |
| `apps/api`          | `src/modules/profile/profile.service.ts`                          | **Modified** | Attached `PROFILE_NOT_FOUND` to account lookups across profile retrieval, update, avatar attach, avatar remove, and completion calculations.                                                                                                                                                                          |
| `apps/api`          | `src/infrastructure/cloudinary/cloudinary.service.ts`             | **Modified** | Attached `AVATAR_INVALID_OWNERSHIP` and `VALIDATION_ERROR` codes to asset boundary security checks.                                                                                                                                                                                                                   |
| `apps/api`          | `src/modules/review/controllers/review.controller.ts`             | **Modified** | Migrated all storefront and admin endpoints (`submitReview`, `getProductReviews`, `getProductRatingSummary`, `listAdminReviews`, `getReviewById`, `moderateReview`, `deleteReview`, `getUserReviews`, `markHelpful`) to `sendSuccess`.                                                                                |
| `apps/api`          | `src/modules/review/services/review.service.ts`                   | **Modified** | Attached `REVIEW_PRODUCT_NOT_FOUND`, `REVIEW_ALREADY_EXISTS`, and `REVIEW_NOT_FOUND` to domain validation and ID lookup errors.                                                                                                                                                                                       |
| `apps/api`          | `src/modules/shipping/controllers/shipping.controller.ts`         | **Modified** | Migrated all storefront and admin endpoints (`calculateRates`, `trackShipment`, `getOrderShipments`, `adminListShipments`, `adminGetShipment`, `adminCreateShipment`, `adminUpdateTracking`, `adminListZones`, `adminCreateZone`, `adminListMethods`, `adminCreateMethod`) to `sendSuccess`.                          |
| `apps/api`          | `src/modules/shipping/services/shipping.service.ts`               | **Modified** | Attached `SHIPMENT_ORDER_NOT_FOUND`, `SHIPMENT_ORDER_INVALID_STATUS`, `SHIPMENT_NOT_FOUND`, and `SHIPPING_ZONE_CONFLICT` to order lookup and logistics exceptions.                                                                                                                                                    |
| `apps/api`          | `src/modules/notification/controllers/notification.controller.ts` | **Modified** | Migrated all in-app notification endpoints (`listNotifications`, `getUnreadCount`, `getNotification`, `markAsRead`, `markAsUnread`, `markAllAsRead`, `deleteNotification`) to `sendSuccess`.                                                                                                                          |
| `apps/api`          | `src/modules/notification/services/notification.service.ts`       | **Modified** | Attached `NOTIFICATION_NOT_FOUND` to ownership verification and identifier check failures.                                                                                                                                                                                                                            |
| `apps/api`          | `src/__tests__/review.test.ts`                                    | **Modified** | Updated test assertions to verify canonical machine-readable codes (`REVIEW_ALREADY_EXISTS` and `REVIEW_PRODUCT_NOT_FOUND`).                                                                                                                                                                                          |
| `docs/migration`    | `10-secondary-domains-migration.md`                               | **Created**  | Comprehensive migration record and route catalog for Task 10.                                                                                                                                                                                                                                                         |
| `docs/architecture` | `backend-driven-messaging-audit.md`                               | **Modified** | Updated with Section 22 (Secondary Domains Migration Architecture) and Section 23 (Complete Pre-Frontend Route & Response Envelope Audit).                                                                                                                                                                            |

---

## 3. Migrated Endpoints Reference

### A. Coupons & Promotions Domain

| HTTP Method & Route                             |  Status   | Stable Response Code       | Backend Copy Message                                   | Notes                                                    |
| :---------------------------------------------- | :-------: | :------------------------- | :----------------------------------------------------- | :------------------------------------------------------- |
| `POST /api/v1/coupons/validate`                 | `200 OK`  | `COUPON_VALIDATED`         | Dynamic (e.g. `"Coupon applied successfully ($X.XX)"`) | Evaluates percentage/fixed discounts, caps, and spends   |
| `GET /api/v1/admin/coupons`                     | `200 OK`  | `COUPONS_FETCHED`          | `"Coupons retrieved successfully."`                    | Returns paginated list with pagination metadata          |
| `GET /api/v1/admin/coupons/:id`                 | `200 OK`  | `COUPON_FETCHED`           | `"Coupon retrieved successfully."`                     | Detailed single coupon inspection                        |
| `POST /api/v1/admin/coupons`                    | `201 Cre` | `COUPON_CREATED`           | `"Coupon created successfully."`                       | Creates new coupon with full rule set                    |
| `PUT /api/v1/admin/coupons/:id`                 | `200 OK`  | `COUPON_UPDATED`           | `"Coupon updated successfully."`                       | Modifies rules, schedule, limits, or discounts           |
| `PATCH /api/v1/admin/coupons/:id/toggle-status` | `200 OK`  | `COUPON_STATUS_UPDATED`    | `"Coupon is now active/inactive."`                     | Toggles coupon availability flag                         |
| `DELETE /api/v1/admin/coupons/:id`              | `200 OK`  | `COUPON_DELETED`           | `"Coupon deleted successfully."`                       | Permanently removes promotional rule                     |
| `GET /api/v1/admin/coupons/:id/analytics`       | `200 OK`  | `COUPON_ANALYTICS_FETCHED` | `"Coupon analytics retrieved successfully."`           | Summarizes redemption counts, revenue, and order average |

### B. Customer Profile Domain

| HTTP Method & Route                            |  Status  | Stable Response Code         | Backend Copy Message                                   | Notes                                                     |
| :--------------------------------------------- | :------: | :--------------------------- | :----------------------------------------------------- | :-------------------------------------------------------- |
| `GET /api/v1/profile`                          | `200 OK` | `PROFILE_FETCHED`            | `"Profile retrieved successfully."`                    | Self-service profile with completion metrics              |
| `PATCH /api/v1/profile`                        | `200 OK` | `PROFILE_UPDATED`            | `"Profile updated successfully."`                      | Strict field allowlist; rejects tampering with role/perms |
| `POST /api/v1/profile/avatar/upload-signature` | `200 OK` | `AVATAR_SIGNATURE_GENERATED` | `"Avatar upload signature generated successfully."`    | Bound to user folder on Cloudinary                        |
| `PATCH /api/v1/profile/avatar`                 | `200 OK` | `AVATAR_UPDATED`             | `"Profile avatar updated successfully."`               | Binds uploaded asset after prefix and CDN validation      |
| `DELETE /api/v1/profile/avatar`                | `200 OK` | `AVATAR_REMOVED`             | `"Profile avatar removed successfully."`               | Clears avatar and safely schedules CDN deletion           |
| `GET /api/v1/profile/completion`               | `200 OK` | `PROFILE_COMPLETION_FETCHED` | `"Profile completion metrics retrieved successfully."` | Returns weighted percentage and pending action items      |

### C. Product Reviews & Ratings Domain

| HTTP Method & Route                               |  Status   | Stable Response Code       | Backend Copy Message                                          | Notes                                                      |
| :------------------------------------------------ | :-------: | :------------------------- | :------------------------------------------------------------ | :--------------------------------------------------------- |
| `POST /api/v1/products/:productId/reviews`        | `201 Cre` | `REVIEW_CREATED`           | `"Your review has been submitted and is pending moderation."` | Evaluates verified purchase; limits to 1 review per patron |
| `GET /api/v1/products/:productId/reviews`         | `200 OK`  | `REVIEWS_FETCHED`          | `"Product reviews retrieved successfully."`                   | Storefront listing of approved reviews only                |
| `GET /api/v1/products/:productId/reviews/summary` | `200 OK`  | `REVIEW_SUMMARY_FETCHED`   | `"Product rating summary retrieved successfully."`            | Average rating and 1-5 star breakdown aggregation          |
| `POST /api/v1/reviews/:id/helpful`                | `200 OK`  | `REVIEW_HELPFUL_RECORDED`  | `"Review marked as helpful."`                                 | Increments community helpfulness counter                   |
| `GET /api/v1/reviews/my-reviews`                  | `200 OK`  | `CUSTOMER_REVIEWS_FETCHED` | `"Customer reviews retrieved successfully."`                  | Self-service reviews submitted by authenticated customer   |
| `GET /api/v1/admin/reviews`                       | `200 OK`  | `ADMIN_REVIEWS_FETCHED`    | `"Admin reviews retrieved successfully."`                     | Moderation queue with review status breakdown metrics      |
| `GET /api/v1/admin/reviews/:id`                   | `200 OK`  | `REVIEW_FETCHED`           | `"Review retrieved successfully."`                            | Detailed review inspection for moderators                  |
| `PATCH /api/v1/admin/reviews/:id/status`          | `200 OK`  | `REVIEW_MODERATED`         | `"Review has been successfully [status]."`                    | Moderates status; recalculates product rating average      |
| `DELETE /api/v1/admin/reviews/:id`                | `200 OK`  | `REVIEW_DELETED`           | `"Review deleted successfully."`                              | Permanently removes review and recalculates product rating |

### D. Shipping & Fulfillment Domain

| HTTP Method & Route                     |  Status   | Stable Response Code        | Backend Copy Message                                  | Notes                                                     |
| :-------------------------------------- | :-------: | :-------------------------- | :---------------------------------------------------- | :-------------------------------------------------------- |
| `POST /api/v1/shipping/calculate-rates` | `200 OK`  | `SHIPPING_RATES_CALCULATED` | `"Shipping rates calculated successfully."`           | Live quotes by postal code, state, and subtotal threshold |
| `GET /api/v1/shipping/track/:id`        | `200 OK`  | `SHIPMENT_TRACKED`          | `"Shipment tracking details retrieved successfully."` | Public tracking lookup by AWB or shipment ID              |
| `GET /api/v1/shipping/orders/:orderId`  | `200 OK`  | `ORDER_SHIPMENTS_FETCHED`   | `"Order shipments retrieved successfully."`           | Customer or admin lookup of all shipments for an order    |
| `GET /api/v1/admin/shipments`           | `200 OK`  | `SHIPMENTS_FETCHED`         | `"Shipments retrieved successfully."`                 | Paginated administrator shipment list with filters        |
| `GET /api/v1/admin/shipments/:id`       | `200 OK`  | `SHIPMENT_FETCHED`          | `"Shipment details retrieved successfully."`          | Detailed single shipment inspection                       |
| `POST /api/v1/admin/shipments`          | `201 Cre` | `SHIPMENT_CREATED`          | `"Shipment manifested successfully"`                  | Fulfills order, creates AWB, advances order to `shipped`  |
| `PATCH /api/v1/admin/shipments/:id/tr`  | `200 OK`  | `SHIPMENT_TRACKING_UPDATED` | `"Shipment tracking updated successfully"`            | Advances tracking event; transitions order to `delivered` |
| `GET /api/v1/admin/shipping/zones`      | `200 OK`  | `SHIPPING_ZONES_FETCHED`    | `"Shipping zones retrieved successfully."`            | Lists configured geographic shipping zones                |
| `POST /api/v1/admin/shipping/zones`     | `201 Cre` | `SHIPPING_ZONE_CREATED`     | `"Shipping zone created successfully"`                | Configures new domestic or international shipping zone    |
| `GET /api/v1/admin/shipping/methods`    | `200 OK`  | `SHIPPING_METHODS_FETCHED`  | `"Shipping methods retrieved successfully."`          | Lists configured shipping methods                         |
| `POST /api/v1/admin/shipping/methods`   | `201 Cre` | `SHIPPING_METHOD_CREATED`   | `"Shipping method created successfully"`              | Configures new carrier delivery method and rates          |

### E. Customer Notifications Domain

| HTTP Method & Route                      |  Status  | Stable Response Code     | Backend Copy Message                      | Notes                                                 |
| :--------------------------------------- | :------: | :----------------------- | :---------------------------------------- | :---------------------------------------------------- |
| `GET /api/v1/notifications`              | `200 OK` | `NOTIFICATIONS_FETCHED`  | `"Notifications retrieved successfully."` | Returns paginated notifications and live unread count |
| `GET /api/v1/notifications/unread-count` | `200 OK` | `UNREAD_COUNT_FETCHED`   | `"Unread count retrieved successfully."`  | Quick badge counter for storefront navigation header  |
| `GET /api/v1/notifications/:id`          | `200 OK` | `NOTIFICATION_FETCHED`   | `"Notification retrieved successfully."`  | Enforces customer ownership boundary                  |
| `PATCH /api/v1/notifications/:id/read`   | `200 OK` | `NOTIFICATION_READ`      | `"Notification marked as read"`           | Marks read and emits updated badge count via socket   |
| `PATCH /api/v1/notifications/:id/unread` | `200 OK` | `NOTIFICATION_UNREAD`    | `"Notification marked as unread"`         | Marks unread and emits updated badge count via socket |
| `PATCH /api/v1/notifications/read-all`   | `200 OK` | `NOTIFICATIONS_ALL_READ` | `"All notifications marked as read"`      | Bulk marks user notifications read; resets count to 0 |
| `DELETE /api/v1/notifications/:id`       | `200 OK` | `NOTIFICATION_DELETED`   | `"Notification deleted successfully"`     | Permanently removes notification from patron inbox    |

---

## 4. Verification and Regression Test Results

- **Automated Regression Suite (`@veyora/api`):**
  - **352 / 352 passing tests** across 23 test suites (`auth.test.ts`, `catalog.test.ts`, `cart.test.ts`, `wishlist.test.ts`, `checkout.test.ts`, `order-lifecycle.test.ts`, `payment.test.ts`, `coupon.test.ts`, `profile.test.ts`, `review.test.ts`, `shipping.test.ts`, `notification-socket-worker.test.ts`, etc.).
  - **Zero regressions** in core commerce domains (Auth, Catalog, Cart, Wishlist, Checkout, Orders, Payments).
- **Strict TypeScript Validation:**
  - `npx tsc --noEmit -p apps/api/tsconfig.json` exited with **0 errors**.
