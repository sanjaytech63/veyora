# Task 15: Admin Business Notification Migration

**Branch:** `feature/backend-driven-notifications`

**Scope:** Customer-facing back-office mutations and their direct notification dependencies.

## Domain Audit

| Domain                                     | Status                                                             |
| ------------------------------------------ | ------------------------------------------------------------------ |
| Authentication and logout                  | Migrated                                                           |
| Dashboard and analytics                    | Already compliant; refresh operations do not claim backend success |
| Product management                         | Migrated                                                           |
| Category, brand, and collection management | Migrated                                                           |
| Inventory and warehouse management         | Migrated                                                           |
| Customer administration and notes          | Migrated                                                           |
| Order management and status updates        | Migrated                                                           |
| Payment administration and refunds         | Migrated                                                           |
| Coupon management                          | Migrated                                                           |
| Review moderation                          | Migrated                                                           |
| Shipping and shipment management           | Migrated                                                           |
| Notification management                    | No notification call site exists                                   |
| Staff, roles, permissions, and RBAC        | Migrated                                                           |
| Audit logs and exports                     | Migrated                                                           |
| Settings                                   | Migrated                                                           |

## Call Sites

Business success and error notifications now use `notifyApiSuccess` and `notifyApiError` through the Admin notification adapter. Direct imports of Sonner have been removed from Admin business components; Sonner remains isolated in the shared UI adapter.

Mutation and component failures are normalized, including profile/avatar, catalog, inventory, customers, orders, refunds, coupons, reviews, shipments, staff, and RBAC operations. Field-level form checks use `notifyWarning` and do not claim backend success.

## Error Codes

The implementation uses the shared normalizer and stable backend codes. Known/handled codes include `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `RATE_LIMIT_EXCEEDED`, `RESOURCE_NOT_FOUND`, `INTERNAL_SERVER_ERROR`, and domain-specific codes such as `INSUFFICIENT_STOCK`, inventory conflicts, order state conflicts, payment/refund failures, duplicate resources, and RBAC permission failures.

Unknown codes fall back to the shared safe normalizer. Aborted and cancelled client requests remain silent.

## Duplicate Notifications

Mutation components own their success/error notifications. The TanStack MutationCache remains opt-in via `notifyError: true`; background queries remain silent. The Admin adapter retains a short deduplication window and no component/global pair is enabled for the same mutation.

## Tests

- `npm run test --workspace=@veyora/admin -- --run src/test/notifications.test.ts` — passed, 5 tests.
- `npm run typecheck --workspace=@veyora/admin` — passed.
- `npm run lint --workspace=@veyora/admin` — passed with 0 errors and 2 existing `no-explicit-any` warnings.

## Remaining Gaps

No identified business mutation currently lacks an adapter migration. Backend success envelopes should provide a message for every user-confirmed mutation; when absent, `notifyApiSuccess` intentionally emits no success toast.
