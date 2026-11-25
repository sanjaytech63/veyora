# Task 13: Frontend Notification & API Error Infrastructure

**Branch:** `feature/backend-driven-notifications`  
**Base commit:** `44a890b`  
**Scope:** Web and Admin API clients, shared API error utilities, notification adapters, and TanStack Query configuration.

## Shared Error Normalization

`@veyora/utils` provides `normalizeApiError` and `normalizeApiSuccess` as framework-independent canonicalization helpers. They accept canonical envelopes, legacy envelopes, Axios-style `response.data`, Fetch/API client errors, validation details, network failures, timeouts, and unknown values. Normalized errors contain a stable code, safe message, validation details, request ID, and HTTP status where available.

Sensitive values, infrastructure text, stack traces, credentials, OTPs, and raw invalid values are excluded from display.

## API Client Response Preservation

Both Web and Admin browser clients:

- Preserve canonical and legacy error codes and messages.
- Attach request correlation IDs and status metadata to `ApiClientError`.
- Support `raw`, `preserveEnvelope`, and Web `getWithMeta()` envelope access.
- Continue to unwrap successful `data` for existing callers.
- Preserve text/CSV responses and return binary responses as `Blob` objects.
- Retain the existing single-flight 401 refresh and retry behavior.

## Notification Adapters

Web and Admin expose reusable, Sonner-backed adapters for success, error, warning, and informational notifications. Notifications use backend-authored text when present and generic fallbacks only for missing or unsafe backend messages. Duplicate notifications are suppressed for 1.5 seconds using code, request ID, and message.

The adapters remain independent of shared packages and do not import React or UI libraries into `@veyora/utils`.

## TanStack Query Policy

Query caches have no automatic toast callbacks; background queries remain silent. Mutation notifications are opt-in through `meta: { notifyError: true }`, preventing unrelated mutation components from receiving duplicate toasts. Existing retries and cache policies remain unchanged.

Stable codes drive deterministic application behavior without parsing message text. Unknown and cancelled errors degrade safely.

## Tests

Focused tests cover shared normalization, Web/Admin adapters, canonical and legacy errors, network behavior, redaction, and existing API refresh compatibility.

## Remaining Work

Business pages and endpoint-specific hooks are not migrated in this task. They may adopt the notification adapters and opt-in mutation metadata in subsequent frontend migrations.
