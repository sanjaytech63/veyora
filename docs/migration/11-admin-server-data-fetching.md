# Veyora Admin App Server-Side Data Fetching Architecture

**Document ID:** `DOC-ARCH-11-ADMIN-SERVER-FETCHING`  
**Execution Date:** November 24, 2026  
**Target Application:** `@veyora/admin` (Port 3001)  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, App Router, Webpack)  
**Status:** Completed, Verified & Production-Ready

---

## 1. Executive Summary

As part of **Task 11 — Veyora Server-Side Data Fetching Architecture**, `@veyora/admin` was evaluated and equipped with a dedicated server-side API client ([apps/admin/src/lib/api/server-api-client.ts](file:///c:/Users/Sanjay/Desktop/veyora/apps/admin/src/lib/api/server-api-client.ts)) to support server-rendered initial metadata and data reads while safeguarding administrative role-based access control (RBAC).

Key architectural considerations:

1. **Administrative Session Boundary:** Administrative API endpoints strictly require valid operator session tokens with `admin` or `superadmin` roles. In the browser, these tokens are managed in memory and secure cookies via `useAdminAuthStore`.
2. **Server-Side Authentication Security:** Server Component reads forward the operator's `refreshToken` cookie via `await cookies()`. If no administrative cookie exists, `serverAdminFetch` throws a 401 `ServerApiClientError` instead of making unauthorized backend calls or leaking company data.
3. **Dynamic Metadata Integration:** Routes like `/products/[id]` now resolve garment titles on the server for document `<title>` metadata using `serverAdminApi.getProduct(id)`.
4. **Client Interactive Leaves Preservation:** High-performance data tables (Orders Ledger, Inventory Matrix, Staff Roster, Audit Logs) intentionally remain client-side, using TanStack Query for debounced search, bulk actions, and real-time Socket.IO subscriptions.

---

## 2. Admin Server API Client Architecture

### 2.1. Server-Only Boundary

```typescript
if (typeof window !== "undefined") {
  throw new Error("server-api-client cannot be imported or executed in a Client Component.");
}
```

### 2.2. Administrative Cookie Forwarding

```typescript
async function getForwardedAdminCookieHeader(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const forwarded: string[] = [];
    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (refreshToken) {
      forwarded.push(`refreshToken=${refreshToken}`);
    }
    return forwarded.join("; ");
  } catch {
    return "";
  }
}
```

### 2.3. Domain-Level Server Data Services

`apps/admin/src/lib/api/server-api-client.ts` exports typed helper methods:

- `serverAdminApi.getProduct(id)`: Fetches product details for administrative editor metadata and initial view.
- `serverAdminApi.getOrder(id)`: Fetches order fulfillment details for server-rendered receipts.
- `serverAdminApi.getCustomer(id)`: Fetches patron dossier for administrative inspection.

---

## 3. Server Components vs. Client Interactive Leaves

| Administrative Domain | Server Responsibility                                                        | Client Responsibility                                                                    | Rationale                                                    |
| --------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **`/products/[id]`**  | Page shell, Dynamic `<title>` generation via `serverAdminApi.getProduct(id)` | `EditProductClient`: Form wizard, SKU variant matrix, image uploader, price adjustments  | High interactivity, local validation, and mutation feedback  |
| **`/orders/[id]`**    | Page shell, metadata                                                         | `OrderDetailClient`: Status transition dropdowns, payment verification, printable slips  | Real-time Socket.IO updates (`ORDER_UPDATED`)                |
| **`/customers/[id]`** | Page shell, metadata                                                         | `CustomerDetailClient`: Patron dossiers, order history, internal staff notes             | Interactive notes modal and patron communication logs        |
| **`/inventory/[id]`** | Page shell, metadata                                                         | `InventoryDetailClient`: Real-time stock adjustments, warehouse bin allocations          | Optimistic inventory updates                                 |
| **`/` (Dashboard)**   | Document shell, metadata                                                     | `DashboardClient`: Recharts velocity visualizations, KPI cards, date range filtering     | TanStack Query background polling and socket synchronization |
| **`/orders`**         | Document shell, metadata                                                     | `OrdersListClient`: Fulfillment tabs (`Pending`, `Processing`, `Shipped`), bulk dispatch | Highly interactive table with multi-column filtering         |

---

## 4. Administrative Security & Error Governance

1. **No Silent 401 Swallowing:** If an unauthenticated or expired request is made on the server, `serverAdminFetch` throws a 401 error. It does NOT convert authorization failures into empty arrays or dummy records.
2. **Error Boundary Integration:** If the backend Express service is temporarily unavailable (503) or times out (504), the error bubbles to [apps/admin/src/app/error.tsx](file:///c:/Users/Sanjay/Desktop/veyora/apps/admin/src/app/error.tsx), presenting the operator with a recovery interface and retry button.
3. **No Credential Propagation in Props:** Server Components pass only sanitized business DTOs to Client Components. Operator bearer tokens, cookie secrets, and backend database connection details never cross the React Server Component boundary.

---

## 5. Items Deferred to Task 13

- Administrative caching rules (e.g. operational data that must always bypass cache vs. static lookup taxonomy).
- Dynamic tag revalidation for inventory counts.
- Explicitly deferred to **Task 13 — Caching & Revalidation Architecture**.
