# Veyora Server & Client Components Boundary Standards

**Document ID:** `DOC-ARCH-09-BOUNDARIES-GUIDE`  
**Execution Date:** November 24, 2026  
**Scope:** `@veyora/web`, `@veyora/admin`, `@veyora/ui`  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, Webpack Compiler)  
**Status:** Canonical Monorepo Standard

---

## 1. Principles of Server & Client Component Composition

Next.js 16.4.6 uses the React Server Components (RSC) architecture by default. In the Veyora monorepo, components must strictly follow these overarching principles:

### 1.1. Server Components by Default

Every new file in `app/` or `components/` is a **Server Component** unless it explicitly requires client-only capabilities. Server Components execute only on the server, generating static HTML and JSON wire data, shipping zero bytes of JavaScript to the browser.

### 1.2. The "Leaves at the Bottom" Rule

Place `"use client"` as low as possible in the component tree.

- **Anti-Pattern:** Adding `"use client"` at `page.tsx` or a major layout file because one button requires an `onClick` handler.
- **Veyora Pattern:** Keep `page.tsx` as a Server Component. Extract only the interactive element (e.g., `CuratedCollectionClient`, `SearchModalTrigger`, `AddToCartButton`) into a client leaf file.

### 1.3. Server Components as Children of Client Components

Client Components can receive Server Components as `children` or other JSX props. This allows wrapping server-rendered subtrees within client contexts (such as theme providers or dialog wrappers) without converting the children into Client Components.

```tsx
// Server Component (Parent)
import { ClientContainer } from "./client-container";
import { ServerRenderedFeed } from "./server-rendered-feed";

export default function Page() {
  return (
    <ClientContainer>
      <ServerRenderedFeed />
    </ClientContainer>
  );
}
```

---

## 2. Component Decision Matrix

Use the matrix below to determine whether a component must be a Server Component or a Client Component:

| Capability Required                                                        | Server Component | Client Component |
| -------------------------------------------------------------------------- | :--------------: | :--------------: |
| Fetch public data from database or backend API directly                    |     **Yes**      |        No        |
| Access backend resources or environment variables securely                 |     **Yes**      |        No        |
| Export route metadata (`metadata` or `generateMetadata`)                   |     **Yes**      |        No        |
| Reduce client JavaScript bundle size                                       |     **Yes**      |        No        |
| Stream large HTML responses progressively                                  |     **Yes**      |        No        |
| Listen to user events (`onClick`, `onChange`, `onSubmit`)                  |        No        |     **Yes**      |
| Use React State or Lifecycle hooks (`useState`, `useEffect`, `useReducer`) |        No        |     **Yes**      |
| Access Browser APIs (`window`, `localStorage`, `navigator`, `geolocation`) |        No        |     **Yes**      |
| Subscribe to WebSocket events (`socket.io-client`)                         |        No        |     **Yes**      |
| Use TanStack Query hooks (`useQuery`, `useMutation`)                       |        No        |     **Yes**      |
| Use Zustand stores (`useAuthStore`, `useCartStore`)                        |        No        |     **Yes**      |
| Render interactive charts (`Recharts`) or complex drag-and-drop            |        No        |     **Yes**      |

---

## 3. Data Serialization & Security Rules

When passing props across the Server-to-Client boundary (from an RSC to a `"use client"` component):

### 3.1. Props Must Be JSON-Serializable

- **Allowed:** Strings, numbers, booleans, null, undefined, plain objects, arrays, and standard Promises.
- **Forbidden:** Functions, callbacks, event handlers, class instances, Symbols, and non-serializable objects.
- **Date Handling:** Convert `Date` instances to ISO-8601 strings (`date.toISOString()`) or numeric timestamps before passing across the boundary to prevent hydration mismatches between server timezones and patron local timezones.

### 3.2. Secret Isolation

- Never pass secret API keys, payment gateway private credentials, or administrative bearer tokens to Client Components.
- Use the Next.js `server-only` package in backend utility files to guarantee they cannot be bundled into client code:
  ```typescript
  import "server-only";
  // Any accidental import into a client component will trigger a build error
  ```

---

## 4. State Management Taxonomy

To prevent data desynchronization and race conditions, state in Veyora applications is managed according to the following strict hierarchy:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PERSISTENT SERVER STATE (Public Catalog, CMS, Lookbooks) │
│    Fetched via Node fetch / async Server Components         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Initial Data via Props
┌──────────────────────────────▼──────────────────────────────┐
│ 2. DYNAMIC CLIENT SERVER STATE (Cart API, Order Transitions) │
│    Managed by TanStack React Query v5                       │
│    - Singleton browser QueryClient                          │
│    - Automatic cache purging on session logout              │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. GLOBAL CLIENT APPLICATION STATE (Cart Drawer, Modals)    │
│    Managed by Zustand Stores                                │
│    - useCartStore, useUiStore, useAuthStore                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 4. LOCAL EPHEMERAL STATE (Form inputs, Swatch selection)     │
│    Managed by React useState / useReducer / React Hook Form │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Developer Checklist for New Features

Before submitting code reviews for new storefront or admin routes, verify compliance with this checklist:

1. [ ] **Route Shell is Server-Side:** Is `src/app/.../page.tsx` a Server Component (no `"use client"`)?
2. [ ] **Metadata Defined:** Does `page.tsx` export static `metadata` or dynamic `generateMetadata`?
3. [ ] **Minimal Client Leaves:** Are `"use client"` directives restricted strictly to interactive subcomponents?
4. [ ] **Serializable Props:** Are all props passed to client leaves fully serializable? (No functions or raw Date objects).
5. [ ] **No Browser APIs in SSR:** Are browser-only APIs (`window`, `localStorage`, `document`) guarded by `useEffect` or executed only inside client event handlers?
6. [ ] **Query Invalidation on Logout:** Does any new authenticated query integrate with `clearQueryClient()` upon patron/operator sign-out?
7. [ ] **Typecheck Clean:** Does `npm run typecheck` pass with 0 errors across all workspaces?
8. [ ] **Build Verified:** Does `npm run build` or `npx next build --webpack` succeed without hydration or RSC serialization warnings?
