# Task 14: Web Business Notification Migration

**Branch:** `feature/backend-driven-notifications`  
**Base commit:** `81a679b`  
**Scope:** Customer-facing Web application business operations.

## Domains Migrated

- Authentication, registration, email verification, password recovery, and reset.
- Customer profile and avatar operations.
- Cart, coupon, wishlist, and address mutations.
- Checkout, order creation, cancellation, payment initiation, and payment verification.
- Customer notifications.
- Reviews and helpful-vote operations.
- Logout in both desktop and mobile navigation.

Socket order/shipment state updates no longer emit frontend-authored toast success text. Backend notification events remain responsible for user-facing real-time messages.

## Complete Domain Audit

| Domain                                   | Status            | Notification treatment                                                                                                                                  |
| ---------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Products and catalog                     | Already compliant | Catalog reads remain silent; out-of-stock is a local availability guard using the shared warning adapter.                                               |
| Cart and coupon operations               | Migrated          | Mutation success/error paths use `notifyApiSuccess` and `notifyApiError`; missing success text is silent.                                               |
| Wishlist                                 | Migrated          | Add, remove, clear, rollback, and mutation failures use the shared adapter.                                                                             |
| Customer profile and avatar              | Migrated          | Profile, avatar upload, and avatar removal use backend success messages or normalized backend errors.                                                   |
| Customer addresses                       | Migrated          | Create, update, delete, and default-address mutations use backend messages/errors.                                                                      |
| Order history, details, and cancellation | Migrated          | Order cancellation and order mutations use backend responses; order and payment state transitions are unchanged.                                        |
| Reviews and ratings                      | Migrated          | Submission and helpful-vote operations use backend success/error handling; form-length checks remain field-level guidance.                              |
| Shipping and tracking                    | Already compliant | Tracking search/copy feedback is local UI feedback. Shipment/socket updates use backend notification content and remain query invalidations.            |
| Authentication/session                   | Migrated          | Login, registration, OTP, password recovery/reset, and logout use backend success or normalized errors; `EMAIL_NOT_VERIFIED` uses stable codes/details. |
| Checkout and payment                     | Migrated          | Order creation, Razorpay initiation, backend verification, failure, dismissal, and retry feedback preserve existing state transitions.                  |
| Customer notifications                   | Migrated          | Notification actions use the shared success/error adapters. Mark-read has no fabricated success toast.                                                  |

Key call-site changes include desktop/mobile logout, login's `EMAIL_NOT_VERIFIED` branch, checkout's Razorpay failure callback, and socket notification events. These now use `notifyApiError`, `notifyApiSuccess`, or `notifyInfo` rather than bypassing the shared adapter.

Remaining direct Sonner usage has been eliminated from business call sites. Sonner is referenced only inside the shared notification adapter and toast renderer.

## Implementation

Business successes use `notifyApiSuccess()`, which reads canonical or legacy backend success messages and does not emit a toast when no backend message exists. Business failures use `notifyApiError()`, backed by `normalizeApiError()`.

The login verification flow now branches only on `EMAIL_NOT_VERIFIED` codes/details. Backend message text is not parsed for application behavior. Field-level checkout, review, and form validation remains local static UX.

Canonical success metadata is retained while existing API methods continue to unwrap `data`. Duplicate notification suppression remains in the Task 13 Web adapter.

Aborted/cancelled client requests are explicitly silent. Mutation-level `onError` handlers own business failures, while the TanStack Query MutationCache remains opt-in and background queries have no toast policy.

## Payment Safety

Payment success notifications are emitted only after server-side payment verification returns successfully. Razorpay callbacks and modal dismissal do not imply confirmed payment. Order and cart state remain tied to existing mutation and verification flows.

## Tests

Executed:

- `npm run test --workspace=@veyora/web -- --run src/test/notifications.test.ts` — 2 notification test files passed, 24 tests passed.
- `npm run typecheck --workspace=@veyora/web` — passed.
- `npm run lint --workspace=@veyora/web` — passed with 6 pre-existing `no-explicit-any` warnings and no errors.

## Remaining Gaps

The newsletter UI is currently a client simulation and has no backend dispatch endpoint. It now avoids claiming a successful subscription. Provider-specific payment callback descriptions are not treated as backend-confirmed success.
