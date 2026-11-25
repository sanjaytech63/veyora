# Task 17: Production-Ready Newsletter Subscription

## API

`POST /api/v1/newsletter/subscribe`

Request:

- `email`: normalized and lowercased by shared Zod validation and the service.
- `consent`: must be `true`.

Success responses are canonical and return `accepted: true` with `status: "pending"`. The public endpoint does not expose existing subscribers or subscriber state.

The endpoint uses the public newsletter rate limiter and the existing global API rate limiter.

## Lifecycle

The subscription is persisted in a dedicated Mongoose collection with a unique normalized email index. Initial state is `pending`; it is not marked active or verified.

No verification token, unsubscribe token, or email is generated or sent. Consequently, there is no false double-opt-in verification or delivery success.

The model preserves:

- Original and normalized email values.
- `pending`, `active`, and `unsubscribed` status.
- Consent timestamp.
- Verification timestamp.
- Unsubscribe timestamp.
- Website source.
- Created and updated timestamps.

## Duplicate and concurrent submissions

Duplicate and concurrent submissions use an atomic `findOneAndUpdate` upsert on `normalizedEmail`. The normalized email field has a database unique index. Duplicate requests receive the same safe success shape and do not reveal whether an existing record exists.

## Email provider and worker

The existing worker email processor is simulated: it creates synthetic message IDs and logs template dispatches but does not call a real email provider. No real SMTP/Resend/provider credentials or templates are used.

A confirmation email, verification token, and unsubscribe link are not implemented. Subscriptions remain pending and are not treated as active marketing subscribers.

## Unsubscribe

Unsubscribe is not implemented because no subscription email is sent and no real email delivery or verification URL exists. Implementing an insecure or synthetic unsubscribe mechanism would create misleading consent behavior.

## Web integration

The footer form requires email plus explicit consent. It calls `newsletterApi.subscribe()` through the existing Web API client and uses `notifyApiSuccess`/`notifyApiError`. It disables submission while pending and resets only after a backend-confirmed success envelope is available.

## Tests

- API valid, invalid, consent, duplicate, concurrent, and unknown-failure cases.
- Mongoose normalized email uniqueness and lifecycle index checks.
- Web success-before-confirmation, missing-message, and failure behavior.
- API/model suites: 9 tests passed.

## Remaining limitations

Real email delivery, double opt-in verification, token verification, and unsubscribe are blocked until a real provider and verified templates are available in the existing architecture.
