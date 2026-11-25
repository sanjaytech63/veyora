# Veyora Monorepo: Backend-Driven Messaging Architecture & Contract Audit

**Document Version:** 1.0.0  
**Status:** Approved Architecture Draft / Planning  
**Branch:** `feature/backend-driven-notifications`  
**Target Applications:** `apps/api`, `apps/web`, `apps/admin`, `apps/worker`, `packages/types`, `packages/utils`, `packages/validators`  
**Author:** Veyora Engineering Core Team  
**Date:** November 2026

---

## 1. Executive Summary

### 1.1 Context and Problem Statement

In the current implementation of the Veyora clothing-only e-commerce monorepo, user-facing notifications (toasts, alerts, banner messages) across `apps/web` (storefront) and `apps/admin` (back-office management) are predominantly hardcoded directly in React components, page files, and custom hooks.

For example, when an item is added to the shopping bag or an authentication error occurs, frontend components contain static definitions such as:

```tsx
// apps/web/src/app/login/page.tsx
toast.success("Welcome back!", {
  description: `Signed in as ${response.user.email}`,
});

toast.error("Sign In Failed", {
  description: err.message,
});
```

Similarly, in `apps/admin`:

```tsx
// apps/admin/src/app/(dashboard)/catalog/products/new/page.tsx
toast.success("Product created successfully");
toast.error("Failed to create product");
```

This pattern suffers from four fundamental architectural flaws:

1. **Message Divergence & Inconsistency:** The same business event (e.g., updating inventory, removing a garment from a bag, invalidating a coupon) displays conflicting copy, casing, and terminology between Web and Admin.
2. **Loss of Backend Authority:** Business logic, validation rules, and authorization boundaries reside in the Express API (`apps/api`), yet copy explaining why an operation succeeded or failed is scattered across dozens of frontend files.
3. **Impediment to Centralized Localization & Compliance:** Internationalization (i18n), regulatory notifications, or brand voice updates require searching and modifying hundreds of individual frontend components rather than central backend message bundles or API metadata.
4. **Fragile Client-Side Error Parsing:** Frontend components frequently inspect raw error strings (e.g., `err.message.toLowerCase().includes("verify your email")`) rather than evaluating deterministic, machine-readable backend error codes.

### 1.2 Audit Scope & Objectives

This audit establishes an end-to-end contract specification and notification architecture designed to:

- Establish the **Express API (`apps/api`)** as the single source of truth for all business outcome messages, authorization denials, domain validation messages, and operational states.
- Define canonical, type-safe API envelopes for both **Success (`ApiSuccessResponse<T>`)** and **Error (`ApiErrorResponse`)** in `@veyora/types`.
- Introduce stable, machine-readable **response codes** (e.g., `AUTH_LOGIN_SUCCESS`, `EMAIL_NOT_VERIFIED`, `INSUFFICIENT_STOCK`) enabling deterministic client-side branching (redirects, OTP verification, modal prompts).
- Provide a standardized, shared frontend notification utility (`notify` over Sonner) and error normalizer (`handleApiError`) for both `apps/web` and `apps/admin`.
- Delineate strict boundaries between queries (inline UI states/error boundaries) and mutations (toasts).

---

## 2. Backend API Messaging Audit (`apps/api`)

An exhaustive audit of all 22 controllers and middleware in `apps/api` revealed high inconsistency in response structures, messaging semantics, and error envelopes.

### 2.1 Current Response Pattern Taxonomy

| Module / Controller                                                                                     | Current Response Pattern                                                          | Top-Level Message Present? | Machine-Readable Code Present? | Metadata / Timestamp Format          |
| :------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------: | :----------------------------: | :----------------------------------- |
| **Auth (`register`)**                                                                                   | `{ success: true, data: { user, message, otp }, timestamp }`                      |   ❌ (Buried in `data`)    |            ❌ None             | Top-level `timestamp` string         |
| **Auth (`login`, `adminLogin`, `refresh`, `me`)**                                                       | `{ success: true, data: T, timestamp }`                                           |          ❌ None           |            ❌ None             | Top-level `timestamp` string         |
| **Auth (`logout`, `forgotPassword`, `resetPassword`, `revokeSession`)**                                 | `{ success: true, data: { message }, timestamp }`                                 |   ❌ (In `data.message`)   |            ❌ None             | Top-level `timestamp` string         |
| **Cart (`getCart`, `addItem`, `updateItem`, `removeItem`, `clearCart`, `applyCoupon`, `removeCoupon`)** | `{ success: true, data: T, message: string }`                                     |         ✅ Present         |            ❌ None             | No `meta` or `timestamp`             |
| **Checkout (`createOrder`, `verifyPayment`)**                                                           | `{ success: true, data: T, message: string }`                                     |         ✅ Present         |            ❌ None             | No `meta` or `timestamp`             |
| **Catalog (`getProducts`, `getProductBySlug`, `getCategories`, etc.)**                                  | `{ success: true, data: T, meta: { total, page, limit, totalPages }, timestamp }` |          ❌ None           |            ❌ None             | Nested `meta` object with pagination |
| **Inventory (`getInventoryLevels`, `reserveStock`)**                                                    | `{ success: true, data: T, meta: { total, page, limit, totalPages }, timestamp }` |          ❌ None           |            ❌ None             | Nested `meta` object with pagination |
| **Notification (`getNotifications`)**                                                                   | `{ success: true, data: T, pagination: { ... }, meta: { ... } }`                  |          ❌ None           |            ❌ None             | Duplicate `pagination` and `meta`    |
| **Notification (`markAsRead`, `markAllAsRead`)**                                                        | `{ success: true, data: T, message: string }`                                     |         ✅ Present         |            ❌ None             | No `meta`                            |
| **Notification (`getUnreadCount`)**                                                                     | `{ success: true, data: { count } }`                                              |          ❌ None           |            ❌ None             | Bare envelope                        |
| **Customer & Profile (`getProfile`, `updateProfile`, `getAddresses`, `addAddress`, `deleteAddress`)**   | `{ success: true, data: T, message: string }`                                     |         ✅ Present         |            ❌ None             | No `meta`                            |
| **Wishlist (`getWishlist`, `addToWishlist`, `removeFromWishlist`, `clearWishlist`)**                    | `{ success: true, data: T, message: string }`                                     |         ✅ Present         |            ❌ None             | No `meta`                            |
| **Coupon (`validateCoupon`, `createCoupon`, `updateCoupon`)**                                           | `{ success: true, data: T, message: string }`                                     |         ✅ Present         |            ❌ None             | No `meta`                            |
| **Payment (`createRazorpayOrder`, `verifyPaymentSignature`)**                                           | `{ success: true, data: T, message: string }`                                     |         ✅ Present         |            ❌ None             | No `meta`                            |
| **Shipping (`getShippingMethods`, `calculateRates`)**                                                   | `{ success: true, data: T, message: string }`                                     |         ✅ Present         |            ❌ None             | No `meta`                            |
| **Review (`createReview`, `getProductReviews`)**                                                        | `{ success: true, data: T, message?: string }`                                    |      ⚠️ Inconsistent       |            ❌ None             | Inconsistent                         |
| **RBAC (`getRoles`, `getPermissions`, `assignRole`)**                                                   | `{ success: true, data: T }`                                                      |          ❌ None           |            ❌ None             | Bare envelope                        |
| **System (`healthCheck`, `systemInfo`)**                                                                | `{ status: "ok", service, uptime, ... }`                                          |          ❌ None           |            ❌ None             | Custom non-standard shape            |

### 2.2 Critical Middleware Discrepancies

#### 1. Error Handler Middleware (`apps/api/src/middleware/error-handler.ts`)

The current error handler generates this response:

```json
{
  "success": false,
  "message": "Resource not found",
  "code": "NOT_FOUND",
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": []
  },
  "errors": {
    "email": ["Invalid email address"]
  },
  "timestamp": "2026-11-25T14:00:00.000Z"
}
```

**Issues Identified:**

- Redundant duplication: `code` and `message` are supplied at the root level and also nested under `error.code` and `error.message`.
- Validation errors are duplicated: `details` is an array of `{ field, message, code }`, while `errors` is a `Record<string, string[]>`.
- Missing correlation: `req.id` is logged via Pino, but is **omitted from the JSON response body**, preventing frontend clients from reporting the correlation ID to users or support.

#### 2. Rate Limiter Middleware (`apps/api/src/middleware/rate-limiter.ts`)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  },
  "timestamp": "2026-11-25T14:00:00.000Z"
}
```

**Issues Identified:**

- The rate limiter drops root-level `code` and `message`, directly conflicting with the structure returned by `error-handler.ts`. Any client relying on `response.message` or `response.code` fails to parse rate-limit errors.

#### 3. Client Unwrapping Defect (`apps/web/src/lib/api/api-client.ts` & `apps/admin/src/lib/api/api-client.ts`)

In both Web and Admin API clients:

```ts
// If wrapped in ApiResponseSuccess format, unwrap data
if (data && typeof data === "object" && "success" in data && data.success === true) {
  return (data as ApiResponseSuccess<T>).data;
}
return data as T;
```

**Critical Discovery:**
The client automatically unwraps `data`, immediately discarding top-level `message`, `code`, and `meta`. Frontend code invoking `apiClient.post(...)` or `apiClient.patch(...)` receives only `T`. Because `response.message` was stripped, frontend developers were forced to invent hardcoded toast messages in UI hooks.

---

## 3. Frontend Notification Audit: Web Storefront (`apps/web`)

An audit of all toast and notification calls across `apps/web/src` identified approximately 80 notification triggers.

### 3.1 Classification Matrix

| File Path                          | Trigger / Event          | Current Hardcoded Message                                              | Classification                 | Target Canonical Code         |
| :--------------------------------- | :----------------------- | :--------------------------------------------------------------------- | :----------------------------- | :---------------------------- |
| `app/login/page.tsx:65`            | Login success            | `toast.success("Welcome back!", { description: ... })`                 | Backend Business Success       | `AUTH_LOGIN_SUCCESS`          |
| `app/login/page.tsx:77`            | Unverified email         | `toast.warning("Email Verification Required", { description: ... })`   | Backend Auth & Verification    | `EMAIL_NOT_VERIFIED`          |
| `app/login/page.tsx:83`            | Login failed             | `toast.error("Sign In Failed", { description: err.message })`          | Backend Business Error         | `INVALID_CREDENTIALS`         |
| `app/register/page.tsx:55`         | Registration success     | `toast.success("Account created successfully!", { description: ... })` | Backend Business Success       | `AUTH_REGISTER_SUCCESS`       |
| `app/register/page.tsx:66`         | Registration failed      | `toast.error("Registration Failed", { description: err.message })`     | Backend Business Error         | `REGISTRATION_FAILED`         |
| `app/verify-otp/page.tsx:43`       | Email verified           | `toast.success("Email Verified", { description: ... })`                | Backend Business Success       | `EMAIL_VERIFIED`              |
| `app/verify-otp/page.tsx:50`       | Invalid OTP              | `toast.error("Verification Failed", { description: ... })`             | Backend Validation Error       | `OTP_INVALID`                 |
| `app/verify-otp/page.tsx:68`       | Resend OTP               | `toast.success("Code Sent", { description: ... })`                     | Backend Business Success       | `OTP_RESENT`                  |
| `app/forgot-password/page.tsx:47`  | Password reset link sent | `toast.success("Reset Code Sent", { description: ... })`               | Backend Business Success       | `AUTH_RESET_CODE_SENT`        |
| `app/reset-password/page.tsx:47`   | Password reset success   | `toast.success("Password Reset Successful", { description: ... })`     | Backend Business Success       | `AUTH_PASSWORD_RESET`         |
| `lib/hooks/use-cart.ts:25`         | Add to cart              | `toast.success("Garment added to bag")`                                | Backend Business Success       | `CART_ITEM_ADDED`             |
| `lib/hooks/use-cart.ts:28`         | Add to cart fail         | `toast.error("Could not add garment", { description: ... })`           | Backend Business Error         | `CART_ADD_FAILED`             |
| `lib/hooks/use-cart.ts:40`         | Update quantity          | `toast.success("Bag updated")`                                         | Backend Business Success       | `CART_ITEM_UPDATED`           |
| `lib/hooks/use-cart.ts:53`         | Remove item              | `toast.success("Garment removed from bag")`                            | Backend Business Success       | `CART_ITEM_REMOVED`           |
| `lib/hooks/use-cart.ts:67`         | Clear cart               | `toast.success("Shopping bag cleared")`                                | Backend Business Success       | `CART_CLEARED`                |
| `lib/hooks/use-cart.ts:81`         | Apply coupon             | `toast.success("Privilege code applied", { description: ... })`        | Backend Business Success       | `COUPON_APPLIED`              |
| `lib/hooks/use-cart.ts:86`         | Invalid coupon           | `toast.error("Invalid coupon code", { description: ... })`             | Backend Business Error         | `COUPON_INVALID`              |
| `lib/hooks/use-cart.ts:97`         | Remove coupon            | `toast.success("Coupon removed")`                                      | Backend Business Success       | `COUPON_REMOVED`              |
| `lib/hooks/use-wishlist.ts:56`     | Add to wishlist          | `toast.success("Saved to Personal Collection", { description: ... })`  | Backend Business Success       | `WISHLIST_ITEM_ADDED`         |
| `lib/hooks/use-wishlist.ts:93`     | Remove from wishlist     | `toast.success("Removed from wishlist")`                               | Backend Business Success       | `WISHLIST_ITEM_REMOVED`       |
| `lib/hooks/use-orders.ts:25`       | Cancel order             | `toast.success("Order Cancelled", { description: ... })`               | Backend Business Success       | `ORDER_CANCELLED`             |
| `lib/hooks/use-addresses.ts:28`    | Add address              | `toast.success("Address saved")`                                       | Backend Business Success       | `ADDRESS_CREATED`             |
| `lib/hooks/use-addresses.ts:52`    | Delete address           | `toast.success("Address deleted")`                                     | Backend Business Success       | `ADDRESS_DELETED`             |
| `app/checkout/page.tsx:165`        | Missing contact          | `toast.error("Contact details required", { description: ... })`        | Frontend Client Validation     | `CLIENT_VALIDATION`           |
| `app/checkout/page.tsx:313`        | Payment verified         | `toast.success("Payment Verified & Confirmed", { description: ... })`  | Backend Business Success       | `PAYMENT_VERIFIED`            |
| `app/checkout/page.tsx:322`        | Payment failed           | `toast.error("Payment Verification Failed", { description: msg })`     | Backend Business Error         | `PAYMENT_VERIFICATION_FAILED` |
| `providers/socket-provider.tsx:82` | Order status changed     | `toast.success(\`Order #${orderNumber} Status: ${status}\`)`           | Backend Real-Time Notification | `ORDER_STATUS_CHANGED`        |

### 3.2 Key Web Findings

1. **String-based branching:** `login/page.tsx` line 74 tests `err.message.toLowerCase().includes("verify your email")` to determine whether to show an "Email Verification Required" warning and redirect to `/verify-otp`. If the backend changes phrasing to "Please verify your account", the redirection breaks.
2. **Inconsistent Naming:** Cart messages use "garment", "item", and "privilege code" inconsistently across different files.
3. **Double Toasts:** When an API error throws, both the low-level hook and the page component occasionally catch and display separate error toasts for the same failure.

---

## 4. Frontend Notification Audit: Admin Portal (`apps/admin`)

An audit of all toast and notification calls across `apps/admin/src` identified approximately 95 notification triggers.

### 4.1 Inconsistencies and Conflicting Patterns

| Domain                   | Action          | Admin Toast Implementation                                                            | Express Backend Response                                                        | Conflict / Problem                                                            |
| :----------------------- | :-------------- | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------ | :---------------------------------------------------------------------------- |
| **Catalog / Brands**     | Create Brand    | `toast.success("Brand created successfully")`<br>`toast.error("Error saving brand")`  | `{ success: true, data: brand, message: "Brand created successfully" }`         | Hardcoded fallback ignores backend error message and reason for conflict.     |
| **Catalog / Categories** | Update Category | `toast.success("Category updated")`<br>`toast.error("Failed to save category")`       | `{ success: true, data: category, message: "Category updated successfully" }`   | Hardcoded string ignores parent category hierarchy errors.                    |
| **Catalog / Products**   | Update Status   | `toast.success("Product status updated")`<br>`toast.error("Failed to update status")` | `{ success: true, data: product, message: "Product status changed to active" }` | Ignores backend validation (e.g., cannot activate product without inventory). |
| **Inventory**            | Adjust Stock    | `toast.success("Stock level updated")`<br>`toast.error("Failed to adjust stock")`     | `{ success: true, data: item, message: "Inventory adjusted: +5 units" }`        | Backend provides exact quantity delta; frontend throws it away.               |
| **Orders**               | Update Status   | `toast.success("Order status updated")`<br>`toast.error("Failed to update order")`    | `{ success: true, data: order, message: "Order transitioned to SHIPPED" }`      | State machine transition errors from backend are concealed.                   |
| **Staff & Roles**        | Assign Role     | `toast.success("Role permissions updated")`<br>`toast.error("Access Denied")`         | `{ success: true, data: role, message: "Permissions assigned" }`                | Root admin restriction error messages are not surfaced.                       |
| **Settings**             | Save Settings   | `toast.success("Store configurations persisted")`                                     | `{ success: true, data: config, message: "Store settings updated" }`            | Discrepant terminology ("persisted" vs "updated").                            |

### 4.2 Key Admin Findings

1. **Generic Error Obfuscation:** Across admin forms (`products/new`, `categories/[id]`, `coupons/new`), errors are frequently caught with `catch (err) { toast.error("Failed to save record"); }`, entirely hiding backend validation errors and server errors from administrative staff.
2. **Missing Correlation IDs:** Admin users encountering internal errors (500) have no way to see or copy the `requestId` to provide to the engineering team.
3. **Query Errors Inundating the UI:** Table query failures trigger toasts while the table is also showing an empty state, leading to notification clutter.

---

## 5. Canonical API Success Response Contract

To eliminate response shape disparities across modules, all successful Express API endpoints must adhere to the canonical `ApiSuccessResponse<T>` schema.

### 5.1 TypeScript Interface Specification (`packages/types/src/api.ts`)

```typescript
/**
 * Canonical metadata envelope for pagination, tracking, and diagnostics
 */
export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  pagination?: ApiPaginationMeta;
  [key: string]: unknown;
}

/**
 * Standard API Success Response Envelope
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  code: string; // Stable uppercase token (e.g. "AUTH_LOGIN_SUCCESS", "CART_ITEM_ADDED")
  message: string; // Human-readable, user-ready confirmation message
  data: T; // Typed payload
  meta: ApiMeta; // Standardized metadata
}
```

### 5.2 Canonical JSON Examples

#### Example 1: Entity Mutation (Add Item to Cart)

```json
{
  "success": true,
  "code": "CART_ITEM_ADDED",
  "message": "Garment added to your shopping bag.",
  "data": {
    "cartId": "cart_654321",
    "item": {
      "variantId": "var_998877",
      "title": "Silk Oxford Shirt",
      "size": "M",
      "color": "Navy",
      "quantity": 1,
      "price": 12000
    },
    "subtotal": 12000,
    "itemCount": 1
  },
  "meta": {
    "requestId": "req_01HPX7K9V1A3J8C5D6E7F8G9H0",
    "timestamp": "2026-11-25T14:05:00.123Z"
  }
}
```

#### Example 2: Paginated Query (Product Catalog)

```json
{
  "success": true,
  "code": "PRODUCTS_FETCHED",
  "message": "Products retrieved successfully.",
  "data": [
    {
      "id": "prod_101",
      "slug": "merino-wool-blazer",
      "title": "Merino Wool Blazer",
      "price": 34000
    }
  ],
  "meta": {
    "requestId": "req_01HPX7M2A8B4C6D8E0F2G4H6J8",
    "timestamp": "2026-11-25T14:05:02.456Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 84,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Example 3: Acknowledgment Action (Password Reset Link Sent)

```json
{
  "success": true,
  "code": "AUTH_RESET_CODE_SENT",
  "message": "If an account exists with this email, a password recovery code has been sent.",
  "data": {
    "email": "customer@example.com"
  },
  "meta": {
    "requestId": "req_01HPX7P3B9C5D7E9F1G3H5J7K9",
    "timestamp": "2026-11-25T14:05:05.789Z"
  }
}
```

---

## 6. Canonical API Error Response Contract

All error responses from Express (controllers, Zod validation, JWT verification, rate limiting, and unhandled exceptions) must adhere to the canonical `ApiErrorResponse` schema.

### 6.1 TypeScript Interface Specification (`packages/types/src/api.ts`)

```typescript
/**
 * Detailed field-level error representation
 */
export interface ApiErrorDetail {
  field?: string; // Dotted path (e.g. "address.postalCode") or undefined for root errors
  message: string; // Human-readable validation constraint explanation
  code?: string; // Specific validation constraint code (e.g. "too_small", "invalid_email")
  received?: unknown; // Redacted value or type received (sanitized)
}

/**
 * Standard API Error Response Envelope
 */
export interface ApiErrorResponse {
  success: false;
  code: string; // Stable uppercase token (e.g. "INSUFFICIENT_STOCK", "VALIDATION_ERROR")
  message: string; // High-level explanation safe for display to users
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  errors?: Record<string, string[]>; // Backwards-compatible map for form libraries
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

### 6.2 Canonical JSON Examples

#### Example 1: 422 Unprocessable Entity (Zod Validation Failure)

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "The submitted form contains invalid or missing information.",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted form contains invalid or missing information.",
    "details": [
      {
        "field": "shippingAddress.postalCode",
        "message": "Postal code must be a valid 6-digit PIN code.",
        "code": "invalid_string"
      },
      {
        "field": "email",
        "message": "A valid corporate or personal email is required.",
        "code": "invalid_string"
      }
    ]
  },
  "errors": {
    "shippingAddress.postalCode": ["Postal code must be a valid 6-digit PIN code."],
    "email": ["A valid corporate or personal email is required."]
  },
  "meta": {
    "requestId": "req_01HPX7R4C0D6E8F0G2H4J6K8L0",
    "timestamp": "2026-11-25T14:05:10.012Z"
  }
}
```

#### Example 2: 409 Conflict (Insufficient Stock During Checkout)

```json
{
  "success": false,
  "code": "INVENTORY_INSUFFICIENT",
  "message": "Selected garment variant is out of stock. Only 2 units remaining.",
  "error": {
    "code": "INVENTORY_INSUFFICIENT",
    "message": "Selected garment variant is out of stock. Only 2 units remaining.",
    "details": [
      {
        "field": "items[0].variantId",
        "code": "OUT_OF_STOCK",
        "message": "Requested 3 units, but only 2 are available in warehouse inventory."
      }
    ]
  },
  "meta": {
    "requestId": "req_01HPX7S5D1E7F9G1H3J5K7L9M1",
    "timestamp": "2026-11-25T14:05:12.345Z"
  }
}
```

#### Example 3: 403 Forbidden (Unverified Customer Email)

```json
{
  "success": false,
  "code": "EMAIL_NOT_VERIFIED",
  "message": "Please verify your email address to continue.",
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "Please verify your email address to continue.",
    "details": [
      {
        "field": "email",
        "code": "UNVERIFIED",
        "message": "Verification OTP sent to your registered address."
      }
    ]
  },
  "meta": {
    "requestId": "req_01HPX7T6E2F8G0H2J4K6L8M0N2",
    "timestamp": "2026-11-25T14:05:15.678Z"
  }
}
```

#### Example 4: 429 Too Many Requests (Rate Limiter)

```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please wait before attempting this action again.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please wait before attempting this action again."
  },
  "meta": {
    "requestId": "req_01HPX7U7F3G9H1J3K5L7M9N1P3",
    "timestamp": "2026-11-25T14:05:18.901Z"
  }
}
```

#### Example 5: 500 Internal Server Error (Database / Uncaught Exception)

```json
{
  "success": false,
  "code": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred while processing your request.",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred while processing your request."
  },
  "meta": {
    "requestId": "req_01HPX7V8G4H0J2K4L6M8N0P2Q4",
    "timestamp": "2026-11-25T14:05:22.234Z"
  }
}
```

---

## 7. Message Ownership Rules (Backend vs Frontend)

A core tenet of this architecture is establishing unambiguous ownership of what text and logic belongs to the backend versus the frontend.

| Concern                          |       Owner       | Responsibility                                                                                        | Examples                                                                                                                                 |
| :------------------------------- | :---------------: | :---------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **Business Outcome Messaging**   |    **Backend**    | Authoritative confirmation copy describing successful state transitions in the domain.                | `"Garment added to your shopping bag."`<br>`"Order #VY-8921 cancelled successfully."`<br>`"Privilege code applied: 15% discount."`       |
| **Business Rule Violations**     |    **Backend**    | Exact domain constraint explanation.                                                                  | `"Coupon requires a minimum spend of ₹2,500."`<br>`"Order cannot be cancelled after dispatch."`<br>`"Selected variant is out of stock."` |
| **Field Validation Rules**       | **Backend (Zod)** | Detailed constraints defined on API request validation schemas.                                       | `"Password must contain at least 8 characters and one symbol."`<br>`"Invalid GSTIN format."`                                             |
| **Security & Auth Denials**      |    **Backend**    | Explaining why access is blocked while guarding sensitive details.                                    | `"Session expired. Please log in again."`<br>`"Email verification required."`<br>`"Invalid email or password."`                          |
| **Client UI Interactions**       |   **Frontend**    | Pure client-side state changes with no network interaction.                                           | `"Link copied to clipboard."`<br>`"Filters cleared."`<br>`"Search input cleared."`                                                       |
| **Network & Transport Failures** |   **Frontend**    | Handling network loss, timeouts, DNS failures, or offline state before or after HTTP reachability.    | `"Unable to reach Veyora servers. Please check your internet connection."`<br>`"Request timed out. Please try again."`                   |
| **Display Formatting & Layout**  |   **Frontend**    | How messages are framed, icon selection, toast durations, audio chimes, dismiss buttons, and styling. | Sonner toast rendering, badge styling, error callout layout, modal dialog composition.                                                   |

---

## 8. Stable Machine-Readable Codes Catalog & Programmatic Behavior

By relying on deterministic machine-readable codes rather than fragile substring matching on `message`, frontend applications can execute unambiguous programmatic actions.

### 8.1 Catalog of Canonical Codes

| Code                       | HTTP Status | Domain    | Frontend Programmatic Action / User Flow                                                  |
| :------------------------- | :---------: | :-------- | :---------------------------------------------------------------------------------------- |
| `AUTH_LOGIN_SUCCESS`       |     200     | Auth      | Update Zustand session state; redirect to `returnUrl` or `/account` / `/admin/dashboard`. |
| `AUTH_LOGOUT_SUCCESS`      |     200     | Auth      | Clear in-memory tokens; reset query cache; navigate to `/login`.                          |
| `AUTH_REGISTER_SUCCESS`    |     201     | Auth      | Navigate to `/verify-otp?email=...`.                                                      |
| `EMAIL_NOT_VERIFIED`       |     403     | Auth      | Navigate immediately to `/verify-otp?email=...`; display warning toast.                   |
| `INVALID_CREDENTIALS`      |     401     | Auth      | Highlight form inputs; focus password field; display error toast.                         |
| `SESSION_EXPIRED`          |     401     | Auth      | Open re-authentication modal or redirect to `/login?session_expired=true`.                |
| `TOKEN_REFRESH_FAILED`     |     401     | Auth      | Perform client-side logout cleanup; redirect to `/login`.                                 |
| `OTP_INVALID`              |     422     | Auth      | Highlight OTP pin boxes; focus first digit; display error toast.                          |
| `OTP_EXPIRED`              |     422     | Auth      | Reset OTP pin boxes; activate "Resend OTP" button.                                        |
| `CART_ITEM_ADDED`          |     200     | Cart      | Open side drawer cart sheet; trigger cart badge bounce animation.                         |
| `CART_ITEM_UPDATED`        |     200     | Cart      | Optimistically update item row total; display success toast.                              |
| `CART_ITEM_REMOVED`        |     200     | Cart      | Animate row departure; update subtotal calculation.                                       |
| `CART_CLEARED`             |     200     | Cart      | Reset cart store; display empty state view.                                               |
| `COUPON_APPLIED`           |     200     | Coupon    | Re-calculate discount breakdown; celebrate with toast.                                    |
| `COUPON_INVALID`           |     400     | Coupon    | Clear coupon input field; display error toast with backend explanation.                   |
| `COUPON_MIN_SPEND_NOT_MET` |     422     | Coupon    | Highlight cart subtotal; suggest related garment upsell.                                  |
| `INVENTORY_INSUFFICIENT`   |     409     | Inventory | Prompt customer to adjust quantity to available maximum; block checkout progression.      |
| `ORDER_PLACED`             |     201     | Checkout  | Navigate to `/checkout/success?orderNumber=...`; clear cart.                              |
| `PAYMENT_PENDING`          |     202     | Payment   | Display verification spinner; poll order status or listen on WebSocket.                   |
| `PAYMENT_FAILED`           |     400     | Payment   | Keep order draft intact; offer customer alternate payment retry.                          |
| `ORDER_CANCELLED`          |     200     | Order     | Invalidate order query; update status chip to `CANCELLED`.                                |
| `ORDER_NOT_CANCELLABLE`    |     400     | Order     | Display warning toast explaining shipment has already been dispatched.                    |
| `VALIDATION_ERROR`         |     422     | Core      | Map `error.details` directly to React Hook Form `setError(field)`.                        |
| `RATE_LIMIT_EXCEEDED`      |     429     | Security  | Disable submit button; show cooldown countdown timer.                                     |
| `INTERNAL_SERVER_ERROR`    |     500     | Core      | Display error toast with clickable `"Copy Request ID: req_xxx"` action.                   |

---

## 9. Shared Frontend Notification Architecture

### 9.1 Unified `notify` Helper Specification

Both `apps/web` and `apps/admin` already use the high-performance Sonner toast engine (`sonner`). We define a unified, type-safe notification interface in `@veyora/utils` (or mirrored in each app's UI kit) to standardize toast behavior:

```typescript
import { toast } from "sonner";
import { ApiSuccessResponse, ApiErrorResponse } from "@veyora/types";

export interface NotifyOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  requestId?: string;
}

/**
 * Unified notification utility ensuring consistent presentation across Web and Admin
 */
export const notify = {
  success(messageOrResponse: string | ApiSuccessResponse<unknown>, options?: NotifyOptions): void {
    const message =
      typeof messageOrResponse === "string" ? messageOrResponse : messageOrResponse.message;

    toast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action,
    });
  },

  error(
    errorOrMessage: unknown,
    fallbackMessage = "An error occurred",
    options?: NotifyOptions
  ): void {
    const normalized = handleApiError(errorOrMessage, fallbackMessage);

    toast.error(normalized.title, {
      description: normalized.description,
      duration: options?.duration ?? 6000,
      action: normalized.requestId
        ? {
            label: "Copy ID",
            onClick: () => {
              navigator.clipboard.writeText(normalized.requestId!);
              toast.info("Request ID copied to clipboard");
            },
          }
        : options?.action,
    });
  },

  warning(message: string, options?: NotifyOptions): void {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      action: options?.action,
    });
  },

  info(message: string, options?: NotifyOptions): void {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action,
    });
  },

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: (data: T) => string;
      error: (err: unknown) => string;
    }
  ) {
    return toast.promise(promise, messages);
  },
};
```

### 9.2 Centralized Error Normalizer (`handleApiError`)

The `handleApiError` utility normalizes any caught failure (Axios/Fetch error, `ApiClientError`, Zod failure, standard JavaScript `Error`, or network offline state) into a uniform structure:

```typescript
export interface NormalizedApiError {
  title: string;
  description: string;
  code: string;
  statusCode: number;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;
}

export function handleApiError(
  error: unknown,
  fallbackTitle = "Request Failed"
): NormalizedApiError {
  // Handle ApiClientError
  if (isApiClientError(error)) {
    return {
      title: error.message || fallbackTitle,
      description:
        error.statusCode >= 500
          ? "Our servers encountered an unexpected issue. Please try again shortly."
          : error.message,
      code: error.code || "API_ERROR",
      statusCode: error.statusCode,
      requestId: error.requestId,
      fieldErrors: error.fieldErrors,
    };
  }

  // Handle standard Network / Abort Error
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return {
        title: "Request Cancelled",
        description: "The operation was interrupted or timed out.",
        code: "TIMEOUT",
        statusCode: 408,
      };
    }
    return {
      title: fallbackTitle,
      description: error.message,
      code: "CLIENT_ERROR",
      statusCode: 0,
    };
  }

  return {
    title: fallbackTitle,
    description: "An unknown error occurred.",
    code: "UNKNOWN_ERROR",
    statusCode: 0,
  };
}
```

---

## 10. TanStack Query Error Handling Rules

A frequent anti-pattern identified in both Web and Admin is the indiscriminate use of toasts inside `useQuery` error callbacks. We establish strict rules for query versus mutation error handling.

### 10.1 Query Rules (Read Operations)

1. **Never fire global toasts on initial background fetch failures:**
   If a user navigates to `/account/orders` or `/admin/catalog/products` and the request fails, showing a popup toast is jarring and leaves a blank screen behind it.
2. **Delegate to Inline UI States or Error Boundaries:**
   - Use TanStack Query's `isError` and `error` state to render an inline error component (e.g. `<EmptyState title="Failed to load orders" onRetry={refetch} />`).
   - For route-level catastrophic failures, allow Next.js App Router error boundaries (`error.tsx`) to catch the error.
3. **Explicit User-Triggered Refetch:**
   Only fire a toast if the user explicitly clicked an interactive "Refresh" button and that specific action failed.

### 10.2 Mutation Rules (Write Operations)

1. **Mandatory Notification Feedback:**
   All mutations (creating, updating, deleting, status transitioning) must provide immediate feedback.
2. **Backend-Driven Success Copy:**
   ```typescript
   const mutation = useMutation({
     mutationFn: (data: AddToCartInput) => cartService.addItem(data),
     onSuccess: (response) => {
       // Response contains backend-driven message and code
       notify.success(response.message);
     },
     onError: (error) => {
       notify.error(error);
     },
   });
   ```
3. **Prevention of Duplicate Toasts:**
   If a mutation defines an `onError` handler, the global `QueryCache` or `MutationCache` `onError` listener must not display a second toast for the same operation.

---

## 11. Shared Package Boundaries & Architecture

To prevent circular dependencies and maintain clean monorepo architecture, responsibilities are partitioned as follows:

```mermaid
graph TD
    T["packages/types"] --> V["packages/validators"]
    T --> U["packages/utils"]
    V --> API["apps/api"]
    V --> WEB["apps/web"]
    V --> ADM["apps/admin"]
    U --> API
    U --> WEB
    U --> ADM
```

### 1. `packages/types`

- **Exports:**
  - `ApiSuccessResponse<T>`
  - `ApiErrorResponse`
  - `ApiErrorDetail`
  - `ApiMeta`
  - `ApiPaginationMeta`
  - `ApiResponseCode` (enum / union of all stable codes)
  - `NormalizedApiError`

### 2. `packages/validators`

- **Exports:**
  - Zod schemas with centralized, domain-approved constraint messages.
  - Form validation schemas used symmetrically by Express request validators and React Hook Form resolvers.

### 3. `packages/utils`

- **Exports:**
  - `AppError` and subclasses (`ValidationError`, `NotFoundError`, `ConflictError`, etc.) with canonical codes.
  - Express response helper: `sendSuccess(res, data, message, code, meta, statusCode)`.
  - Frontend error normalizer: `handleApiError(error, fallback)`.
  - Correlation ID utilities (`generateRequestId`).

---

## 12. Security, Privacy & Pino Logging Architecture

### 12.1 Request Correlation Pipeline

1. Incoming HTTP requests pass through correlation middleware:
   - Read incoming `x-request-id` header (if provided by client or Cloudflare/reverse proxy).
   - If missing, generate a cryptographically secure UUID (`req_01HPX...`).
   - Attach `req.id = requestId` and set response header `X-Request-Id: requestId`.
2. Pino logs include child bindings:
   ```typescript
   req.log = logger.child({
     requestId: req.id,
     userId: req.user?.id,
     role: req.user?.role,
   });
   ```
3. Response metadata automatically populates:
   ```json
   "meta": {
     "requestId": req.id,
     "timestamp": new Date().toISOString()
   }
   ```

### 12.2 Sensitive Data Redaction & Masking

To comply with security and privacy standards (PCI-DSS for Razorpay, GDPR, and data protection):

1. **Never Log Sensitive Payloads:**
   Pino redaction rules configured in `apps/api/src/config/logger.ts` redact:
   `req.headers.authorization`, `req.headers.cookie`, `req.body.password`, `req.body.confirmPassword`, `req.body.token`, `req.body.refreshToken`, `req.body.cardNumber`, `req.body.cvv`, `req.body.otp`.
2. **Never Expose Internal Details to Clients:**
   In production (`NODE_ENV === "production"`):
   - Internal database error messages (e.g., Mongoose cast errors, MongoDB duplicate key index numbers) are converted to user-friendly messages (`"The specified resource already exists."`).
   - Stack traces (`err.stack`) are NEVER included in `ApiErrorResponse`.
   - Server file paths and environment variables are strictly suppressed.
3. **Correlation-Based Support:**
   When a 500 Internal Server Error occurs, the user sees `"An unexpected error occurred"` alongside the `requestId`. Engineers look up the exact stack trace in centralized Pino logs using the `requestId`.

---

## 13. Migration & Backwards Compatibility Architecture

To prevent downtime and ensure incremental adoption without breaking working storefront and admin features, the architecture provides 100% backwards compatibility:

1. **Dual Envelope Support During Transition:**
   The error handler will return both modern fields (`code`, `message`, `meta.requestId`) and legacy fields (`error.code`, `error.message`, `errors`).
2. **Client Unwrapping Flexibility:**
   The enhanced `ApiClient` will provide:
   - Standard unwrapped `data` for existing read calls (preserving legacy expectations).
   - `requestEnvelope<T>()` / `mutate<T>()` methods that return the full `{ data, message, code, meta }` envelope for mutations.
3. Full phased execution details are documented in [backend-driven-messaging-audit.md](file:///c:/Users/Sanjay/Desktop/veyora/docs/migration/backend-driven-messaging-audit.md).

---

## 14. Task 02 Implementation Details

The foundational shared API response contracts and error utilities were implemented and verified in Task 02:

### 14.1 Canonical Response Types (`packages/types/src/api.ts`)

- **`ApiPaginationMeta`**: Standard pagination structure with `page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage`.
- **`ApiMeta`**: Standard diagnostic metadata containing optional `requestId`, `timestamp`, and `pagination`.
- **`ApiSuccessResponse<T>`**: Strongly typed canonical success envelope with `code`, `message`, `data: T`, and optional `meta`.
- **`ApiErrorDetail`**: Detailed field validation constraint representation with `field`, `code`, and `message`.
- **`ApiErrorResponse`**: Strongly typed canonical error envelope with `code`, `message`, optional `details`, and `meta`.
- **`ApiPaginatedResponse<T>`**: Dedicated extension for paginated collection endpoints.
- **`ApiResponse<T>`**: Universal union covering canonical and legacy response shapes.

### 14.2 Central Error-Code Catalog (`packages/types/src/codes.ts`)

- Grouped domain objects and union types:
  - `ApiAuthCode`: `AUTH_LOGIN_SUCCESS`, `AUTH_LOGOUT_SUCCESS`, `AUTH_REGISTER_SUCCESS`, `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `SESSION_EXPIRED`, `SESSION_REVOKED`, `INSUFFICIENT_PERMISSIONS`.
  - `ApiCoreCode`: `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `DUPLICATE_REQUEST`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_SERVER_ERROR`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`.
  - `ApiCommerceCode`: `CART_ITEM_ADDED`, `CART_ITEM_UPDATED`, `CART_ITEM_REMOVED`, `CART_LOADED`, `CART_CLEARED`, `COUPON_APPLIED`, `COUPON_INVALID`, `COUPON_REMOVED`, `INSUFFICIENT_STOCK`, `ORDER_PLACED`, `ORDER_CANCELLED`, `ORDER_NOT_CANCELLABLE`.
  - `ApiPaymentCode`: `PAYMENT_FAILED`, `PAYMENT_VERIFIED`, `PAYMENT_VERIFICATION_FAILED`, `PAYMENT_PENDING`.
  - `ApiResponseCode`: Composite union of all domain codes.

### 14.3 Framework-Independent Error Normalization (`packages/utils/src/api-error.ts`)

- **`normalizeApiError(error, fallbackMessage)`**: Converts any error, response envelope, or network failure into a safe `NormalizedApiError` (`{ code, message, details, requestId, statusCode }`).
- **`isSafeUserFacingMessage(message)`**: Tests whether an error message is safe to display, filtering out raw database exceptions (`MongoError`, `CastError`, `duplicate key`), infrastructure connectivity failures (`ECONNREFUSED`, `ETIMEDOUT`), system paths, and leaked credentials (`Bearer`, `token=`, `password=`, `otp=`).
- **Type Guards**: `isApiSuccessResponse`, `isApiErrorResponse`, `isLegacyApiResponseError`.
- **Extraction Helpers**: `extractErrorCode`, `extractErrorMessage`, `extractErrorDetails`, `extractRequestId`.

### 14.4 Shared Package Boundaries

- **Strict Separation:** `packages/types` contains only TypeScript contracts and code constants. `packages/utils` contains pure runtime functions.
- **No UI Coupling:** Zero imports of React, Sonner, `toast`, `navigator.clipboard`, Next.js, or Express in shared packages.
- **Universal Portability:** Compatible across Node.js runtime (Express API, BullMQ Worker) and browser runtimes (Web, Admin).

### 14.5 Backward Compatibility

- Preserves `ApiResponseSuccess<T>` and `ApiResponseError` legacy interfaces.
- Supports duck-typed `ApiClientError` without importing frontend classes.
- Safely maps legacy nested `error.code`, `error.message`, and `errors: Record<string, string[]>` into canonical formats.

---

## 15. Task 03 Express API Response Infrastructure Implementation

The core response infrastructure and error middleware for `apps/api` were implemented and verified in Task 03:

### 15.1 Centralized Success Response Helper (`apps/api/src/utils/response.ts`)

- **`sendSuccess<T>(res, options)`**:
  Constructs and sends an `ApiSuccessResponse<T>` with HTTP status (default 200), stable `code`, user-facing `message`, generic `data`, and merged `meta` (`requestId`, `timestamp`, `pagination`).
- Supports both modern options object (`{ statusCode, code, message, data, meta }`) and positional parameter signatures.
- Automatically resolves correlation ID from `req.id` / `res.getHeader("X-Request-Id")`.

### 15.2 Global Error Middleware (`apps/api/src/middleware/error-handler.ts`)

- Normalizes domain `AppError` instances, Zod `ValidationError` instances, MongoDB `E11000 duplicate key` exceptions, and Mongoose `CastError` exceptions into the canonical `ApiErrorResponse` envelope.
- Suppresses database collection names, raw MongoDB indexes, and file paths.
- Masks stack traces from client responses while logging detailed diagnostic stack traces to Pino for server errors (`statusCode >= 500`).
- Provides a transitional backwards-compatibility layer (`error: { code, message, details }`, `errors: Record<string, string[]>`) ensuring zero breaking changes for existing test assertions and legacy clients.

### 15.3 Canonical Rate Limiting (`apps/api/src/middleware/rate-limiter.ts`)

- Harmonized `apiRateLimiter` and domain-specific limiters (`authRateLimiter`, `otpRateLimiter`, `refreshRateLimiter`, `paymentRateLimiter`, `couponRateLimiter`).
- Emits canonical `ApiErrorResponse` with `code: "RATE_LIMIT_EXCEEDED"`, HTTP status 429, correlation `meta.requestId`, and standard `Retry-After` header.

### 15.4 Request Correlation Architecture (`apps/api/src/middleware/request-id.ts`)

- Enforces strict validation policy on incoming `x-request-id` header (`/^[a-zA-Z0-9_\-.:]{1,64}$/`).
- Safely rejects malformed, overly long, or suspicious identifiers and falls back to `crypto.randomUUID()`.
- Binds correlation ID to `req.id`, `req.requestId`, `req.log = logger.child({ requestId })`, and the `X-Request-Id` response header.

### 15.5 Request Validation Integration (`apps/api/src/middleware/validate-request.ts`)

- Standardized high-level validation error message to `"Please review the submitted information."`.
- Maps nested validation paths (e.g. `shippingAddress.postalCode`, `items[0].quantity`) directly to `details` array.

---

## 16. Task 04 Express Authentication Controller Migration

The entire Express authentication subsystem (`apps/api/src/modules/auth`) was migrated to the canonical `sendSuccess` helper and standardized error codes in Task 04:

### 16.1 Controller Standardization (`apps/api/src/modules/auth/auth.controller.ts`)

- Migrated all public and protected auth endpoints to `sendSuccess(res, { statusCode, code, message, data })`.
- Refresh tokens are strictly excluded from response JSON payloads across all endpoints.
- Cookie management remains governed by `auth-cookie.config.ts`, issuing `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth` cookies with 7-day retention.

### 16.2 Service & Domain Error Codes (`apps/api/src/modules/auth/services/auth.service.ts` & `otp.service.ts`)

- Implemented deterministic machine-readable codes for all authentication failures:
  - `INVALID_CREDENTIALS`: 401 Unauthorized for incorrect email or password.
  - `EMAIL_NOT_VERIFIED`: 401 Unauthorized for unverified customer login (includes email field detail for client navigation).
  - `ACCOUNT_INACTIVE`: 403 Forbidden for deactivated accounts.
  - `SESSION_EXPIRED`: 401 Unauthorized when refresh session expires.
  - `SESSION_REVOKED`: 401 Unauthorized when a revoked token or token replay attempt is detected (triggers family revocation).
  - `INVALID_REFRESH_TOKEN`: 401 Unauthorized when refresh token signature is missing or corrupted.
  - `OTP_INVALID`: 400 Bad Request for incorrect OTP code.
  - `OTP_EXPIRED`: 400 Bad Request for expired OTP code.
  - `PASSWORD_RESET_REQUEST_RECEIVED`: 200 OK for constant-time account-enumeration-safe forgot-password submissions.
  - `PASSWORD_RESET_SUCCESS`: 200 OK for successful password reset (revokes all existing sessions).

---

## 17. Task 05 Express Product & Catalog Controller Migration

The entire Express product, catalog, and search domain (`apps/api/src/modules/catalog` and `apps/api/src/modules/search`) was migrated to the canonical `sendSuccess` helper and standardized domain error codes in Task 05:

### 17.1 Controller Standardization

- Migrated all public and admin catalog controllers to `sendSuccess(res, { statusCode, code, message, data, extra, meta })`:
  - `product.controller.ts`: `listProducts` (`PRODUCTS_FETCHED`), `getProduct` (`PRODUCT_FETCHED`), `createProduct` (`PRODUCT_CREATED`), `updateProduct` (`PRODUCT_UPDATED`), `deleteProduct` (`PRODUCT_DELETED`), `getStats` (`CATALOG_STATS_FETCHED`).
  - `category.controller.ts`: `listCategories` (`CATEGORIES_FETCHED`), `getCategoryTree` (`CATEGORY_TREE_FETCHED`), `getCategory` (`CATEGORY_FETCHED`), `createCategory` (`CATEGORY_CREATED`), `updateCategory` (`CATEGORY_UPDATED`), `deleteCategory` (`CATEGORY_DELETED`).
  - `brand.controller.ts`: `listBrands` (`BRANDS_FETCHED`), `getBrand` (`BRAND_FETCHED`), `createBrand` (`BRAND_CREATED`), `updateBrand` (`BRAND_UPDATED`), `deleteBrand` (`BRAND_DELETED`).
  - `collection.controller.ts`: `listCollections` (`COLLECTIONS_FETCHED`), `getCollection` (`COLLECTION_FETCHED`), `createCollection` (`COLLECTION_CREATED`), `updateCollection` (`COLLECTION_UPDATED`), `deleteCollection` (`COLLECTION_DELETED`).
  - `search.controller.ts`: `search` (`SEARCH_RESULTS_FETCHED`), `getSuggestions` (`SEARCH_SUGGESTIONS_FETCHED`).

### 17.2 Backward Compatibility & Frontend Safety

- `sendSuccess` was updated to support optional `extra?: Record<string, unknown>`. Search results supply top-level `facets` and `query` to ensure complete compatibility with existing storefront search components and SEO tests.
- Admin deletion responses preserve `{ message, deleted: true }` in `data` while delivering top-level canonical `code` and `message`.

### 17.3 Service Domain Errors & Stable Codes

- Services throw `ConflictError` and `NotFoundError` with explicit stable domain codes:
  - Products: `SKU_CONFLICT` (409), `PRODUCT_NOT_FOUND` (404), `CATEGORY_NOT_FOUND` (404), `BRAND_NOT_FOUND` (404).
  - Categories: `CATEGORY_CONFLICT` (409), `CATEGORY_NOT_FOUND` (404).
  - Brands: `BRAND_CONFLICT` (409), `BRAND_NOT_FOUND` (404).
  - Collections: `COLLECTION_NOT_FOUND` (404).

---

## 18. Task 06 Express Cart Controller Migration

The entire Express Cart domain (`apps/api/src/modules/cart`) was migrated to the canonical `sendSuccess` helper and standardized domain error codes in Task 06:

### 18.1 Controller Standardization

- Migrated all cart routes to `sendSuccess(res, { statusCode, code, message, data })`:
  - `GET /api/v1/cart`: `getCart` (`CART_FETCHED`, 200 OK)
  - `POST /api/v1/cart/items`: `addItem` (`CART_ITEM_ADDED`, 201 Created)
  - `PATCH /api/v1/cart/items/:itemId`: `updateQuantity` (`CART_ITEM_UPDATED`, 200 OK)
  - `DELETE /api/v1/cart/items/:itemId`: `removeItem` (`CART_ITEM_REMOVED`, 200 OK)
  - `DELETE /api/v1/cart`: `clearCart` (`CART_CLEARED`, 200 OK)
  - `POST /api/v1/cart/coupon`: `applyCoupon` (`COUPON_APPLIED`, 200 OK)
  - `DELETE /api/v1/cart/coupon`: `removeCoupon` (`COUPON_REMOVED`, 200 OK)
  - `POST /api/v1/cart/sync`: `syncCart` (`CART_SYNCED`, 200 OK)

### 18.2 Service Domain Errors & Stable Codes

- Services throw `ConflictError`, `NotFoundError`, and `BadRequestError` with domain-specific stable machine-readable codes:
  - `INSUFFICIENT_STOCK` (409 Conflict) for requested quantity > on-hand inventory.
  - `PRODUCT_OUT_OF_STOCK` (409 Conflict) for products with 0 stock.
  - `PRODUCT_NOT_AVAILABLE` (404 Not Found) for inactive or draft garments.
  - `INVALID_PRODUCT_VARIANT` (400 Bad Request) for invalid variant ID/SKU.
  - `CART_ITEM_NOT_FOUND` (404 Not Found) when updating or removing non-existent cart items.
  - `COUPON_INVALID` (400 Bad Request) for invalid or expired promotional codes.

### 18.3 Cart Business Rules Preserved

- **Server-Authoritative Pricing & Totals:** Unit prices are retrieved strictly from server database records; spoofed client prices are ignored. Subtotal, discounts, shipping fees, estimated tax, and free-shipping thresholds are recalculated on the server.
- **Guest & Patron Isolation:** Guest sessions use `x-guest-id` headers or cookies. Authenticated users are isolated by their verified JWT claims and session records. User A cannot read or modify User B's cart.
- **Bulk Bag Synchronization:** `/cart/sync` bulk-synchronizes client items, clamps quantities to available inventory, and resolves server pricing.

---

## 19. Task 07 Express Wishlist & Customer Commerce Migration

The entire Express Wishlist domain (`apps/api/src/modules/wishlist`) and customer delivery address management endpoints (`apps/api/src/modules/checkout/address.router.ts`) were migrated to the canonical `sendSuccess` helper and standardized domain error codes in Task 07:

### 19.1 Controller Standardization

- Migrated all Wishlist routes to `sendSuccess(res, { statusCode, code, message, data })`:
  - `GET /api/v1/wishlist`: `getWishlist` (`WISHLIST_FETCHED`, 200 OK)
  - `POST /api/v1/wishlist/items`: `addItem` (`WISHLIST_ITEM_ADDED`, 201 Created)
  - `DELETE /api/v1/wishlist/items/:productId`: `removeItem` (`WISHLIST_ITEM_REMOVED`, 200 OK)
  - `DELETE /api/v1/wishlist`: `clearWishlist` (`WISHLIST_CLEARED`, 200 OK)
- Migrated all Customer Address routes to `sendSuccess(res, { statusCode, code, message, data })`:
  - `GET /api/v1/addresses`: `listAddresses` (`CUSTOMER_ADDRESSES_FETCHED`, 200 OK)
  - `POST /api/v1/addresses`: `createAddress` (`CUSTOMER_ADDRESS_CREATED`, 201 Created)
  - `PUT /api/v1/addresses/:addressId`: `updateAddress` (`CUSTOMER_ADDRESS_UPDATED`, 200 OK)
  - `DELETE /api/v1/addresses/:addressId`: `deleteAddress` (`CUSTOMER_ADDRESS_DELETED`, 200 OK)
  - `PATCH /api/v1/addresses/:addressId/default`: `setDefaultAddress` (`CUSTOMER_DEFAULT_ADDRESS_UPDATED`, 200 OK)

### 19.2 Service Domain Errors & Stable Codes

- Services throw `NotFoundError` and `BadRequestError` with domain-specific stable machine-readable codes:
  - `WISHLIST_NOT_FOUND` (400 Bad Request) when missing cart/guest identifier.
  - `PRODUCT_NOT_AVAILABLE` (404 Not Found) when adding a non-existent or inactive garment to wishlist.
  - `CUSTOMER_ADDRESS_NOT_FOUND` (404 Not Found) when target address ID does not exist.
  - `CUSTOMER_ADDRESS_UNAUTHORIZED` (400 Bad Request) when caller is unauthorized to edit or delete the address.

### 19.3 Business Rules Preserved

- **Wishlist Idempotency & Availability:** Duplicate additions succeed gracefully without creating duplicate entries. Inactive/draft products are rejected.
- **Address Management & Ownership:** Strict user/guest ownership checks prevent cross-user mutations. Setting a default address atomically updates the default state across all user addresses.

---

## 20. Task 08 Express Checkout & Orders Migration

The entire Express Checkout and Orders domain (`apps/api/src/modules/checkout/checkout.router.ts`, `controllers/checkout.controller.ts`, and `services/checkout.service.ts`) was migrated to the canonical `sendSuccess` helper and standardized domain error codes in Task 08:

### 20.1 Controller Standardization

- Migrated all Checkout and Storefront Order routes to `sendSuccess(res, { statusCode, code, message, data })`:
  - `GET /api/v1/checkout/validate`: `validateCheckout` (`CHECKOUT_VALIDATED`, 200 OK)
  - `POST /api/v1/checkout/orders`: `createOrder` (`ORDER_CREATED`, 201 Created)
  - `GET /api/v1/orders`: `listOrders` (`ORDERS_FETCHED`, 200 OK)
  - `GET /api/v1/orders/:orderId`: `getOrder` (`ORDER_FETCHED`, 200 OK)
  - `GET /api/v1/checkout/orders/:orderId`: `getOrder` (`ORDER_FETCHED`, 200 OK)
  - `POST /api/v1/orders/:orderId/cancel`: `cancelOrder` (`ORDER_CANCELLED`, 200 OK)
- Migrated all Administrator Order Governance routes to `sendSuccess(res, { statusCode, code, message, data, meta })`:
  - `GET /api/v1/admin/orders`: `adminListOrders` (`ADMIN_ORDERS_FETCHED`, 200 OK with `meta` pagination)
  - `GET /api/v1/admin/orders/:orderId`: `adminGetOrder` (`ADMIN_ORDER_FETCHED`, 200 OK)
  - `PATCH /api/v1/admin/orders/:orderId/status`: `adminUpdateOrderStatus` (`ORDER_STATUS_UPDATED`, 200 OK)
  - `POST /api/v1/admin/orders/:orderId/cancel`: `adminCancelOrder` (`ORDER_CANCELLED`, 200 OK)

### 20.2 Service Domain Errors & Stable Codes

- Services throw `BadRequestError`, `ConflictError`, and `NotFoundError` with domain-specific stable machine-readable codes:
  - `CHECKOUT_CART_EMPTY` (400 Bad Request) when checking out with zero cart items.
  - `CHECKOUT_PRODUCT_UNAVAILABLE` (400 Bad Request / 409 Conflict) when product or variant is inactive or zero stock.
  - `CHECKOUT_INSUFFICIENT_STOCK` (409 Conflict) when requested quantity exceeds available inventory stock.
  - `ORDER_NOT_FOUND` (404 Not Found) when order ID does not exist or caller fails patron ownership check.
  - `ORDER_STATUS_INVALID` (400 Bad Request) on unauthorized or arbitrary status transitions.
  - `ORDER_CANNOT_BE_CANCELLED` (400 Bad Request) when an order is in an unmodifiable terminal state or already dispatched.

### 20.3 Commercial & State Machine Integrity Preserved

- **Server-Authoritative Pricing:** Subtotals, coupons, tiered shipping, and tax calculations are strictly authoritative and calculated on the server; client tampering is safely rejected.
- **Strict State Machine:** Follows `pending` -> `confirmed` -> `processing` -> `shipped` -> `delivered`. Terminal states reject arbitrary mutations.
- **Idempotency & Reservation Safety:** Deduplication keys prevent duplicate orders. Cancellation automatically restores reserved inventory and records stock movements.
- **Payment Boundary:** Razorpay handlers, signatures, webhooks, and payment verifications remained intentionally untouched and isolated for Task 09.

---

## 21. Task 09 Express Razorpay Payments Migration

The entire Express Payment domain (`apps/api/src/modules/payment`) was migrated to the canonical `sendSuccess` helper and standardized domain error codes in Task 09:

### 21.1 Controller Standardization

- Migrated all Customer & Storefront Payment routes to `sendSuccess(res, { statusCode, code, message, data })`:
  - `POST /api/v1/payments/initiate`: `initiatePayment` (`PAYMENT_ORDER_CREATED`, 200 OK)
  - `POST /api/v1/payments/verify`: `verifyPayment` (`PAYMENT_VERIFIED`, 200 OK)
  - `POST /api/v1/payments/retry`: `retryPayment` (`PAYMENT_RETRY_INITIATED`, 200 OK)
  - `GET /api/v1/payments/status/:orderId`: `getPaymentStatus` (`PAYMENT_DETAILS_FETCHED`, 200 OK)
- Migrated Administrator Refund Governance to `sendSuccess(res, { statusCode, code, message, data })`:
  - `POST /api/v1/admin/payments/:orderId/refund`: `adminRefundPayment` (`REFUND_PROCESSED`, 200 OK)
- Standardized Webhook Ingestion with Protocol-Compliant Response:
  - `POST /api/v1/payments/webhook/razorpay`: `handleRazorpayWebhook` (`PAYMENT_WEBHOOK_PROCESSED` / `PAYMENT_WEBHOOK_IGNORED`, 200 OK with `{ status: "ok", success: true }`)

### 21.2 Service Domain Errors & Stable Codes

- Services throw `BadRequestError`, `ConflictError`, `NotFoundError`, and `UnauthorizedError` with domain-specific stable machine-readable codes:
  - `ORDER_NOT_FOUND` (404 Not Found) when order ID is invalid or caller fails patron ownership check.
  - `PAYMENT_ORDER_CREATION_FAILED` (400 Bad Request) when attempting payment on an already cancelled or refunded order.
  - `PAYMENT_ALREADY_SETTLED` (409 Conflict) when order already has a successful settlement record.
  - `PAYMENT_NOT_FOUND` (404 Not Found) when payment record is missing.
  - `PAYMENT_SIGNATURE_INVALID` (400 Bad Request) on cryptographic HMAC-SHA256 signature mismatch.
  - `PAYMENT_WEBHOOK_SIGNATURE_INVALID` (401 Unauthorized) when webhook HMAC validation fails against raw body.
  - `REFUND_CREATION_FAILED` (400 Bad Request) when missing gateway payment ID.
  - `REFUND_ALREADY_PROCESSED` (400 Bad Request) when order has already been fully refunded.

### 21.3 Payment & Security Integrity Preserved

- **Cryptographic Signature Verification:** Strict server-side HMAC-SHA256 signature verification protects against frontend tampering; unverified success claims are rejected.
- **Webhook Raw-Body Preservation & Idempotency:** Webhook requests verify signatures against raw payload buffers. Duplicate events are acknowledged with `PAYMENT_WEBHOOK_IGNORED` and `duplicate: true` without repeating order transitions or email dispatch.
- **Authoritative Financial Reconciliation:** Order amounts are strictly derived from persisted order records; client amount spoofing is rejected.
- **Refund Boundary Governance:** Validates remaining refundable balance before dispatching gateway refund requests, transitioning payment to `partially_refunded` or `refunded`.

---

## 22. Task 10 Express Secondary Domains Migration

Task 10 completed the migration of all secondary commerce modules in `apps/api`:

- **Coupons & Promotions (`apps/api/src/modules/coupon`):** Storefront discount calculation engine and administrator promotional governance.
- **Customer Profile (`apps/api/src/modules/profile`):** Authenticated user profile, safe field allowlist updates, avatar signature generation, asset binding, and completion calculation.
- **Product Reviews & Ratings (`apps/api/src/modules/review`):** Storefront reviews, star rating summary breakdowns, verified purchase checks, single-review enforcement, and administrator moderation queue.
- **Shipping & Fulfillment (`apps/api/src/modules/shipping`):** Dynamic shipping rates, destination zone resolution, public tracking lookups, order fulfillment, and tracking timeline advancement.
- **Customer Notifications (`apps/api/src/modules/notification`):** In-app user notifications, pagination, unread counters, socket notifications, and status mutations.

### 22.1 Controller Standardization Summary

All endpoints across the five secondary domains now invoke `sendSuccess(res, { statusCode, code, message, data, meta })`:

- Storefront discount validation returns `COUPON_VALIDATED` (200 OK).
- Admin coupon CRUD returns `COUPONS_FETCHED`, `COUPON_FETCHED`, `COUPON_CREATED` (201), `COUPON_UPDATED`, `COUPON_STATUS_UPDATED`, `COUPON_DELETED`, and `COUPON_ANALYTICS_FETCHED`.
- Customer profile endpoints return `PROFILE_FETCHED`, `PROFILE_UPDATED`, `AVATAR_SIGNATURE_GENERATED`, `AVATAR_UPDATED`, `AVATAR_REMOVED`, and `PROFILE_COMPLETION_FETCHED`.
- Review endpoints return `REVIEW_CREATED` (201), `REVIEWS_FETCHED`, `REVIEW_SUMMARY_FETCHED`, `REVIEW_HELPFUL_RECORDED`, `CUSTOMER_REVIEWS_FETCHED`, `ADMIN_REVIEWS_FETCHED`, `REVIEW_FETCHED`, `REVIEW_MODERATED`, and `REVIEW_DELETED`.
- Shipping endpoints return `SHIPPING_RATES_CALCULATED`, `SHIPMENT_TRACKED`, `ORDER_SHIPMENTS_FETCHED`, `SHIPMENTS_FETCHED`, `SHIPMENT_FETCHED`, `SHIPMENT_CREATED` (201), `SHIPMENT_TRACKING_UPDATED`, `SHIPPING_ZONES_FETCHED`, `SHIPPING_ZONE_CREATED` (201), `SHIPPING_METHODS_FETCHED`, and `SHIPPING_METHOD_CREATED` (201).
- Notification endpoints return `NOTIFICATIONS_FETCHED`, `UNREAD_COUNT_FETCHED`, `NOTIFICATION_FETCHED`, `NOTIFICATION_READ`, `NOTIFICATION_UNREAD`, `NOTIFICATIONS_ALL_READ`, and `NOTIFICATION_DELETED`.

### 22.2 Service Domain Errors & Stable Codes

All secondary domain services throw `BadRequestError`, `ConflictError`, and `NotFoundError` with domain-specific stable machine-readable codes:

- Coupons: `COUPON_NOT_FOUND`, `COUPON_INACTIVE`, `COUPON_NOT_STARTED`, `COUPON_EXPIRED`, `COUPON_USAGE_LIMIT_EXCEEDED`, `COUPON_CUSTOMER_LIMIT_EXCEEDED`, `COUPON_NOT_APPLICABLE`, `COUPON_MINIMUM_SPEND_NOT_MET`, `COUPON_CODE_CONFLICT`.
- Profile: `PROFILE_NOT_FOUND`, `AVATAR_INVALID_OWNERSHIP`.
- Reviews: `REVIEW_PRODUCT_NOT_FOUND`, `REVIEW_ALREADY_EXISTS`, `REVIEW_NOT_FOUND`.
- Shipping: `SHIPMENT_ORDER_NOT_FOUND`, `SHIPMENT_ORDER_INVALID_STATUS`, `SHIPMENT_NOT_FOUND`, `SHIPPING_ZONE_CONFLICT`.
- Notifications: `NOTIFICATION_NOT_FOUND`.

---

## 23. Complete Pre-Frontend Route & Response Envelope Audit

Prior to beginning frontend toast notification integration (Task 11+), an exhaustive repository-wide audit was conducted across all Express API routes mounted in `apps/api/src/app.ts`.

### 23.1 Status of Core Commerce & Secondary Backend Modules (Migrated)

All routes in the following domains return the canonical `ApiSuccessResponse<T>` and `ApiErrorResponse` envelopes with stable machine-readable codes:

| Domain Module                               | Route Prefix / Scope                                                                        | Migration Status             |
| :------------------------------------------ | :------------------------------------------------------------------------------------------ | :--------------------------- |
| **Authentication (`auth`)**                 | `/api/v1/auth/*`                                                                            | **Migrated (Task 04)**       |
| **Catalog (`catalog`)**                     | `/api/v1/products/*`, `/api/v1/categories/*`, `/api/v1/admin/...`                           | **Migrated (Task 05)**       |
| **Cart (`cart`)**                           | `/api/v1/cart/*`                                                                            | **Migrated (Task 06)**       |
| **Wishlist (`wishlist`)**                   | `/api/v1/wishlist/*`                                                                        | **Migrated (Task 07)**       |
| **Customer Addresses (`checkout/address`)** | `/api/v1/addresses/*`                                                                       | **Migrated (Task 07)**       |
| **Checkout & Orders (`checkout`)**          | `/api/v1/checkout/*`, `/api/v1/orders/*`, `/api/v1/admin/orders/*`                          | **Migrated (Task 08)**       |
| **Razorpay Payments (`payment`)**           | `/api/v1/payments/*`, `/api/v1/admin/payments/*`                                            | **Migrated (Task 09)**       |
| **Coupons & Promotions (`coupon`)**         | `/api/v1/coupons/*`, `/api/v1/admin/coupons/*`                                              | **Migrated (Task 10)**       |
| **Customer Profile (`profile`)**            | `/api/v1/profile/*`                                                                         | **Migrated (Task 10)**       |
| **Product Reviews (`review`)**              | `/api/v1/products/:id/reviews/*`, `/api/v1/admin/reviews/*`                                 | **Migrated (Task 10)**       |
| **Shipping & Logistics (`shipping`)**       | `/api/v1/shipping/*`, `/api/v1/admin/shipments/*`, `/admin/shipping`                        | **Migrated (Task 10)**       |
| **Notifications (`notification`)**          | `/api/v1/notifications/*`                                                                   | **Migrated (Task 10)**       |
| **Catalog Search (`search`)**               | `/api/v1/search/*`                                                                          | **Migrated (Catalog Phase)** |
| **Admin Analytics (`analytics`)**           | `/api/v1/admin/analytics/*`                                                                 | **Migrated (Task 11)**       |
| **Customer Administration (`customer`)**    | `/api/v1/admin/customers/*`                                                                 | **Migrated (Task 11)**       |
| **RBAC & Staff Governance (`rbac`)**        | `/api/v1/admin/permissions`, `/api/v1/admin/roles/*`, `/admin/staff/*`, `/admin/audit-logs` | **Migrated (Task 11)**       |
| **Warehouse Inventory (`inventory`)**       | `/api/v1/admin/inventory/*`                                                                 | **Migrated (Task 12)**       |

### 23.2 Remaining Unmigrated API Routes (Out-of-Scope Domains)

With the completion of Task 12, **100% of all business-facing API endpoints across Veyora are fully migrated** to the canonical backend-driven response architecture.

The only remaining endpoints returning non-canonical formats are low-level technical protocol exceptions:

#### System Probes & Diagnostics (`apps/api/src/modules/health`, `apps/api/src/modules/system`) — Technical Protocol Exceptions

- `GET /health`, `GET /health/live`, `GET /health/ready` (Kubernetes/load-balancer probe payload `{ status: "ok"|"degraded", service, uptime, ... }`)
- `GET /metrics` (Prometheus text exposition format via prom-client `res.send()`)
- `GET /api/v1/system/info`, `GET /api/v1/system/ping`, `GET /api/v1/system/env` (internal server diagnostics payload)

---

## 24. Admin Analytics, Customer Administration & RBAC Migration (Task 11)

### 24.1 Architecture & Endpoints Migrated

Task 11 migrated all administrative analytics, customer governance, and RBAC endpoints to the canonical backend-driven response architecture using `sendSuccess()`:

1. **Admin Analytics (`apps/api/src/modules/analytics`)**:
   - `GET /api/v1/admin/analytics/dashboard` -> `ADMIN_ANALYTICS_DASHBOARD_FETCHED`
   - `GET /api/v1/admin/analytics/revenue` -> `ADMIN_ANALYTICS_REVENUE_FETCHED`
   - `GET /api/v1/admin/analytics/orders` -> `ADMIN_ANALYTICS_ORDERS_FETCHED`
   - `GET /api/v1/admin/analytics/customers` -> `ADMIN_ANALYTICS_CUSTOMERS_FETCHED`
   - `GET /api/v1/admin/analytics/products` -> `ADMIN_ANALYTICS_PRODUCTS_FETCHED`
   - `GET /api/v1/admin/analytics/inventory` -> `ADMIN_ANALYTICS_INVENTORY_FETCHED`

2. **Customer Administration (`apps/api/src/modules/customer`)**:
   - `GET /api/v1/admin/customers` -> `ADMIN_CUSTOMERS_FETCHED`
   - `GET /api/v1/admin/customers/:id` -> `ADMIN_CUSTOMER_FETCHED`
   - `GET /api/v1/admin/customers/:id/orders` -> `ADMIN_CUSTOMER_ORDERS_FETCHED`
   - `GET /api/v1/admin/customers/:id/addresses` -> `ADMIN_CUSTOMER_ADDRESSES_FETCHED`
   - `PATCH /api/v1/admin/customers/:id/status` -> `ADMIN_CUSTOMER_STATUS_UPDATED`
   - `PATCH /api/v1/admin/customers/:id/notes` -> `ADMIN_CUSTOMER_NOTES_UPDATED`
   - `GET /api/v1/admin/customers/:id/activity` -> `ADMIN_CUSTOMER_ACTIVITY_FETCHED`

3. **Role-Based Access Control (`apps/api/src/modules/rbac`)**:
   - `GET /api/v1/admin/permissions` -> `RBAC_PERMISSIONS_FETCHED`
   - `GET /api/v1/admin/roles` -> `RBAC_ROLES_FETCHED`
   - `GET /api/v1/admin/roles/:id` -> `RBAC_ROLE_FETCHED`
   - `POST /api/v1/admin/roles` -> `RBAC_ROLE_CREATED`
   - `PUT /api/v1/admin/roles/:id` -> `RBAC_ROLE_UPDATED`
   - `DELETE /api/v1/admin/roles/:id` -> `RBAC_ROLE_DELETED`
   - `GET /api/v1/admin/staff` -> `RBAC_STAFF_FETCHED`
   - `GET /api/v1/admin/staff/:id` -> `RBAC_STAFF_MEMBER_FETCHED`
   - `POST /api/v1/admin/staff` -> `RBAC_STAFF_CREATED`
   - `PUT /api/v1/admin/staff/:id` -> `RBAC_STAFF_UPDATED`
   - `PATCH /api/v1/admin/staff/:id/status` -> `RBAC_STAFF_STATUS_UPDATED`
   - `DELETE /api/v1/admin/staff/:id` -> `RBAC_STAFF_DELETED`
   - `GET /api/v1/admin/audit-logs` -> `RBAC_AUDIT_LOGS_FETCHED`

### 24.2 Security & Protocol Policies Enforced

- **Least Privilege Safeguards**: Prevents non-superadmins from granting permissions they do not possess (`RBAC_PRIVILEGE_ESCALATION`).
- **Administrative Account Protection**: Prevents self-deactivation, self-deletion, and deactivation/deletion/demotion of the sole remaining active Superadmin (`RBAC_SELF_ACTION_FORBIDDEN`).
- **System Role Protections**: System roles (`superadmin`, `admin`) are non-deletable (`RBAC_SYSTEM_ROLE_PROTECTED`).
- **Protocol Exception Preservation**: Any raw file downloads (such as CSV exports) retain native `res.send()` transport without JSON wrapping.

---

## 25. Warehouse Inventory Migration (Task 12)

### 25.1 Architecture & Endpoints Migrated

Task 12 migrated all Warehouse Inventory management endpoints to the canonical response architecture:

- `GET /api/v1/admin/inventory/stats` -> `INVENTORY_STATS_FETCHED`
- `GET /api/v1/admin/inventory/low-stock` -> `INVENTORY_LOW_STOCK_FETCHED`
- `GET /api/v1/admin/inventory` -> `INVENTORY_ITEMS_FETCHED`
- `GET /api/v1/admin/inventory/:skuOrId` -> `INVENTORY_ITEM_FETCHED`
- `GET /api/v1/admin/inventory/:skuOrId/movements` -> `INVENTORY_MOVEMENTS_FETCHED`
- `POST /api/v1/admin/inventory/adjust` -> `INVENTORY_ADJUSTED`
- `POST /api/v1/admin/inventory/reserve` -> `INVENTORY_RESERVED`
- `POST /api/v1/admin/inventory/release` -> `INVENTORY_RELEASED`
- `POST /api/v1/admin/inventory/commit` -> `INVENTORY_COMMITTED`
- `PATCH /api/v1/admin/inventory/:skuOrId/threshold` -> `INVENTORY_THRESHOLD_UPDATED`

### 25.2 Stock Invariants & Concurrency Safeguards

- **Available Stock Calculation**: `available = Math.max(0, onHand - reserved)`. Stock decreases below available quantity are rejected with `INVENTORY_INSUFFICIENT_STOCK` (409).
- **Recount Validation**: Recount corrections below reserved levels are rejected with `INVENTORY_ADJUSTMENT_INVALID` (409).
- **Reservation Bound Checking**: Reserving stock exceeding available stock is rejected with `INVENTORY_INSUFFICIENT_STOCK` (409).
- **Movement Ledger**: Every stock change creates an immutable `StockMovement` entry capturing delta quantities, reference IDs, and user attribution.
- **Product Catalog Synchronization**: All changes to `onHand` quantities synchronize parent product and variant stocks in the catalog.

---

## 26. Architecture Signoff & Final State of All Business Modules

This architectural contract and implementation provide the complete foundation for Veyora's transition to a backend-driven messaging system. **100% of all business domains** (Auth, Catalog, Cart, Wishlist, Addresses, Checkout, Orders, Payments, Coupons, Profile, Reviews, Shipping, Notifications, Analytics, Customer Admin, RBAC, and Warehouse Inventory) are now fully migrated, strictly typed, and verified with **353 / 353 passing tests**. The codebase is now prepared for frontend toast notification and client integration (Task 13 / Frontend Phase).

## 27. Frontend Notification Infrastructure (Task 13)

Task 13 establishes the framework-independent and application-specific notification foundation without migrating individual business pages:

- `@veyora/utils` provides canonical and legacy API success/error normalization, Axios and Fetch compatibility, safe validation details, request IDs, network/timeout flags, and sensitive-data redaction.
- Web and Admin API clients preserve canonical/legacy error metadata, support envelope-preserving reads, and keep text/CSV and binary responses compatible.
- Reusable Sonner-backed Web and Admin notification adapters render backend-authored messages and suppress duplicate notifications.
- TanStack Query caches remain silent for background query failures. Mutation notifications are opt-in via `meta: { notifyError: true }`.
- Authentication refresh, permission handling, retry policies, and existing cache behavior remain unchanged.

The infrastructure is complete for subsequent page-by-page frontend migration, but business-page notification copy has not been migrated in this task.
