# Veyora Admin App TanStack Query Architecture & Client Data Fetching

**Document ID:** `DOC-ARCH-12-ADMIN-QUERY`  
**Execution Date:** November 24, 2026  
**Target Application:** `@veyora/admin` (Port 3001)  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, TanStack Query v5, Webpack)  
**Status:** Completed, Verified & Production-Ready

---

## 1. Executive Summary

As part of **Task 12 — Veyora TanStack Query Client-Side Data Fetching Optimization**, `@veyora/admin` was audited and upgraded to standardize data fetching, table queries, and mutation lifecycles on TanStack Query v5.

Key outcomes:

1. **Modernized Administrative CRUD Views:** Migrated manual `useState`/`useEffect` data fetching in [ProductsListClient](file:///c:/Users/Sanjay/Desktop/veyora/apps/admin/src/app/products/products-list-client.tsx), [InventoryListClient](file:///c:/Users/Sanjay/Desktop/veyora/apps/admin/src/app/inventory/inventory-list-client.tsx), and [CustomersListClient](file:///c:/Users/Sanjay/Desktop/veyora/apps/admin/src/app/customers/customers-list-client.tsx) to TanStack Query hooks (`useQuery`, `useMutation`), eliminating manual state management and boilerplate.
2. **Centralized Admin Query Key Factories:** Established `adminAnalyticsKeys` alongside `adminOrderKeys`, `adminInventoryKeys`, `adminShipmentKeys`, `adminPaymentKeys`, `adminCatalogKeys`, and `adminCustomerKeys` in [apps/admin/src/lib/api/query-keys.ts](file:///c:/Users/Sanjay/Desktop/veyora/apps/admin/src/lib/api/query-keys.ts).
3. **Real-Time WebSocket Synchronization:** Modernized components now respond automatically to real-time events (`ADMIN_INVENTORY_UPDATED`, `ADMIN_ORDER_NEW`, `ORDER_UPDATED`, `PAYMENT_UPDATED`) emitted by the backend via `AdminSocketProvider`, updating data tables without requiring manual page reloads.
4. **Idempotent Mutation Invalidation:** Delete, adjust stock, and status mutations invalidate domain query keys (`all`), guaranteeing immediate cache consistency.

---

## 2. Admin Typed Query Key Factories

All query keys in `@veyora/admin` are centralized in [apps/admin/src/lib/api/query-keys.ts](file:///c:/Users/Sanjay/Desktop/veyora/apps/admin/src/lib/api/query-keys.ts):

| Factory                            | Structure                                | Purpose                                                        |
| ---------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| **`adminAnalyticsKeys.dashboard`** | `["admin-dashboard", filters]`           | Master analytics dashboard KPIs, revenue velocity, and orders  |
| **`adminOrderKeys.list`**          | `["admin-orders", filters]`              | Order fulfillment ledger table with status, search, and page   |
| **`adminOrderKeys.unfulfilled`**   | `["admin-unfulfilled-orders"]`           | Quick-dispatch pending fulfillment queue                       |
| **`adminCatalogKeys.products`**    | `["admin-catalog", "products", filters]` | Garment catalog table with category, stock, and status filters |
| **`adminCatalogKeys.categories`**  | `["admin-catalog", "categories"]`        | Category taxonomy options                                      |
| **`adminInventoryKeys.list`**      | `["admin-inventory", filters]`           | Inventory SKU matrix, warehouse locations, and stock alerts    |
| **`adminShipmentKeys.list`**       | `["admin-shipments", filters]`           | Carrier dispatch ledger and AWB tracking numbers               |
| **`adminCustomerKeys.list`**       | `["admin-customers", filters]`           | Patron registry, spend velocity, and account status            |

---

## 3. Modernized Administrative Client Components

### 3.1. Garment Catalog Management (`ProductsListClient`)

- Replaced manual `loadData` effect with:
  ```typescript
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: adminCatalogKeys.products({ limit: 50 }),
    queryFn: () => adminCatalogApi.getProducts({ limit: 50 }),
  });
  ```
- Mutation: `deleteProductMutation` invalidates `adminCatalogKeys.all` upon product archiving.

### 3.2. Inventory Stock Matrix (`InventoryListClient`)

- Replaced manual `loadInventory` effect with:
  ```typescript
  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: adminInventoryKeys.list({ limit: 100 }),
    queryFn: () => adminInventoryApi.getInventory({ limit: 100 }),
  });
  ```
- Mutation: `adjustStockMutation` updates SKU counts and invalidates `adminInventoryKeys.all`.
- Real-Time Integration: When `ADMIN_INVENTORY_UPDATED` arrives over WebSocket, `AdminSocketProvider` invalidates `["admin-inventory"]`, triggering an automatic background refetch.

### 3.3. Patron Registry (`CustomersListClient`)

- Replaced manual `fetchCustomers` with:
  ```typescript
  const { data, isLoading: loading } = useQuery({
    queryKey: adminCustomerKeys.list({ search, status: statusFilter, page }),
    queryFn: () => adminCustomersApi.listCustomers({ search, status, page, limit: 15 }),
  });
  ```
- Status and internal notes updates automatically invalidate `adminCustomerKeys.all`.

### 3.4. Executive Dashboard (`DashboardClient`)

- Integrated with `adminAnalyticsKeys.dashboard({ period, customStart, customEnd })`.
- Provides 60-second `staleTime` to balance metrics freshness with server load.

---

## 4. WebSocket Event Matrix & Invalidation Targets

| Server Event              | Payload                      | Invalidation Query Key                        | Affected Component                      |
| ------------------------- | ---------------------------- | --------------------------------------------- | --------------------------------------- |
| `ADMIN_ORDER_NEW`         | `{ orderNumber, total }`     | `adminOrderKeys.all`                          | `OrdersListClient`, `DashboardClient`   |
| `ORDER_UPDATED`           | `{ orderNumber, status }`    | `adminOrderKeys.all`                          | `OrdersListClient`, `OrderDetailClient` |
| `PAYMENT_UPDATED`         | `{ orderId, status }`        | `adminPaymentKeys.all`, `adminOrderKeys.all`  | `OrdersListClient`                      |
| `SHIPMENT_UPDATED`        | `{ trackingNumber, status }` | `adminShipmentKeys.all`, `adminOrderKeys.all` | `ShipmentsPage`, `OrdersListClient`     |
| `ADMIN_INVENTORY_UPDATED` | `{ sku, stock }`             | `adminInventoryKeys.all`                      | `InventoryListClient`                   |

---

## 5. Items Deferred to Task 13

- ISR and tag-based revalidation for administrative catalog changes.
- Caching policies for public lookups vs private operator mutations.
- Explicitly deferred to **Task 13 — Caching & Revalidation Architecture**.
