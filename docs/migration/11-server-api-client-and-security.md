# Veyora Server API Client, Security Boundaries & Data Serialization Standards

**Document ID:** `DOC-ARCH-11-SERVER-SECURITY-DATA`  
**Execution Date:** November 24, 2026  
**Scope:** `@veyora/web`, `@veyora/admin`  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, App Router, Webpack)  
**Status:** Canonical Monorepo Standard

---

## 1. Principles of Server-Side Data Access

In the Veyora monorepo, data fetching for Server Components must adhere to strict security, performance, and maintainability rules:

1. **Dedicated Server Clients:** Server Components must never import browser-facing API clients that access `window`, `localStorage`, or client-side Zustand stores. All Server Component data access must go through `server-api-client.ts`.
2. **Server-Only Isolation:** Server API client files must include a runtime guard (`if (typeof window !== "undefined") throw ...`) to guarantee they are never bundled into client JavaScript.
3. **No Private Secrets in Client Bundles:** Environment variables containing API keys, webhook secrets, database credentials, or internal URLs must never use the `NEXT_PUBLIC_` prefix.
4. **Selective Cookie Forwarding:** Server Components must only forward relevant session cookies (`refreshToken`, `guest_id`) via `await cookies()`. Request headers must never be forwarded indiscriminately.
5. **No Token Exposure in Props:** Access tokens, refresh tokens, and internal session identifiers must never be serialized into React component props.

---

## 2. Server vs. Client API Client Architecture

```
┌────────────────────────────────────────────────────────┐
│ NEXT.JS APP ROUTER RUNTIME                             │
├──────────────────────────┬─────────────────────────────┤
│ SERVER RUNTIME (Node.js) │ BROWSER RUNTIME (DOM)       │
├──────────────────────────┼─────────────────────────────┤
│ server-api-client.ts     │ api-client.ts               │
│ - Node native fetch      │ - Browser fetch             │
│ - INTERNAL_API_URL       │ - NEXT_PUBLIC_API_URL       │
│ - next/headers cookies() │ - In-memory Zustand token   │
│ - AbortController timeout│ - RefreshToken retry loop   │
│ - ServerApiClientError   │ - ApiClientError            │
│ - ZERO client JS bundle  │ - TanStack Query cached     │
└──────────────────────────┴─────────────────────────────┘
```

---

## 3. Data Serialization & DTO Mapping Rules

When data is fetched on the server and passed across the RSC-to-Client boundary as props:

### 3.1. Strict JSON Serializability

- **Allowed:** Plain objects, arrays, strings, numbers, booleans, null, undefined.
- **Forbidden:** Functions, callbacks, class instances, Symbols, and Mongoose document instances.
- **Dates:** All timestamps must be converted to ISO-8601 strings (`date.toISOString()`) or numeric timestamps prior to passing as props to eliminate server/client timezone hydration mismatches.

### 3.2. Data Sanitization

- Never pass internal backend fields (such as `passwordHash`, `__v`, internal database IDs, or third-party API keys) to Client Components.
- Use explicit TypeScript DTOs from `@veyora/types` (`Product`, `Category`, `Collection`, `OrderDto`, `AuthUser`) to guarantee type safety and prevent unintended payload bloat.

---

## 4. Error Normalization Taxonomy

All server-side requests normalize errors into `ServerApiClientError`:

| HTTP Status | Error Code            | Component Action        | User-Facing Behavior                        |
| ----------- | --------------------- | ----------------------- | ------------------------------------------- |
| **400**     | `VALIDATION_ERROR`    | Throw error to boundary | Error boundary displays validation feedback |
| **401**     | `UNAUTHORIZED`        | Redirect to `/login`    | Patron/operator prompted to authenticate    |
| **403**     | `FORBIDDEN`           | Throw error to boundary | Access denied notification                  |
| **404**     | `NOT_FOUND`           | Call `notFound()`       | Renders route `not-found.tsx`               |
| **422**     | `UNPROCESSABLE`       | Throw error to boundary | Form validation error display               |
| **503**     | `SERVICE_UNAVAILABLE` | Throw error to boundary | `error.tsx` offers retry button             |
| **504**     | `GATEWAY_TIMEOUT`     | Throw error to boundary | `error.tsx` offers retry button             |

---

## 5. Developer Conventions for New Server Component Data Reads

When adding a new route or server-rendered section:

1. **Import from `server-api-client.ts`:** Call `serverFetch` or domain helpers (`serverCatalog`, `serverAdminApi`).
2. **Never import `apiClient` or `catalogApi` in a Server Component:** Those are reserved for Client Components and hooks.
3. **Handle 404s cleanly:** Use `if (err.isNotFound()) notFound();` to trigger Next.js not-found views.
4. **Pass minimal serializable props:** Pass only the required data to client leaf components.
5. **Verify with targeted checks:** Run `npx tsc --noEmit -p apps/web` (or `apps/admin`) to confirm clean compilation.
