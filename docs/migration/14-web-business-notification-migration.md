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

## Implementation

Business successes use `notifyApiSuccess()`, which reads canonical or legacy backend success messages and does not emit a toast when no backend message exists. Business failures use `notifyApiError()`, backed by `normalizeApiError()`.

The login verification flow now branches only on `EMAIL_NOT_VERIFIED` codes/details. Backend message text is not parsed for application behavior. Field-level checkout, review, and form validation remains local static UX.

Canonical success metadata is retained while existing API methods continue to unwrap `data`. Duplicate notification suppression remains in the Task 13 Web adapter.

## Payment Safety

Payment success notifications are emitted only after server-side payment verification returns successfully. Razorpay callbacks and modal dismissal do not imply confirmed payment. Order and cart state remain tied to existing mutation and verification flows.

## Tests

Focused Web notification tests cover canonical success envelopes and missing success messages. Existing Web API refresh tests remain in the focused run.

## Remaining Gaps

The newsletter UI is currently a client simulation and has no backend dispatch endpoint. It now avoids claiming a successful subscription. Provider-specific payment callback descriptions are not treated as backend-confirmed success.
