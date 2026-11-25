# Veyora Admin Layout Architecture & Navigation Shell Standardization

**Document ID:** `DOC-MIG-08-ADMIN-LAYOUT`  
**Execution Date:** November 24, 2026  
**Target Application:** `@veyora/admin` (Port 3001)  
**Framework Version:** Next.js `16.4.6` (React 19.0.0, Webpack Compiler, Tailwind CSS v4)  
**Status:** Completed & Verified

---

## 1. Executive Summary

Task 08 audited and standardized the administrative layout architecture across `@veyora/admin`. The goal was to establish a strict separation between unauthenticated operator access (the `/login` portal) and the protected administrative dashboard, eliminate duplicate navigation mountings, optimize real-time Socket.IO subscriptions, and implement proper cache eviction to prevent confidential data leaks between operator sessions.

All existing administrative workflows, including catalog management, inventory ledger adjustments, patron dossiers, and order fulfillment tracking, were preserved with zero regressions.

---

## 2. Existing vs. Final Layout Hierarchy

### Initial Hierarchy

```
apps/admin/src/app/
├── layout.tsx (Server Component: HTML, Body, Dark theme)
│   └── AppProviders (Client: ThemeProvider -> QueryProvider -> AdminAuthProvider -> AdminSocketProvider -> TooltipProvider -> Toaster)
│       └── AdminLayout (Client: usePathname check -> AdminProtectedRoute -> AdminSidebar + AdminHeader + main)
│           └── {children}
```

### Standardized Final Hierarchy

```
apps/admin/src/app/
├── layout.tsx [Server Component: Document Root]
│   ├── HTML (lang="en", suppressHydrationWarning)
│   ├── Body (min-h-screen, dark background, antialiased)
│   └── AppProviders [Client Component: Application Contexts]
│       ├── ThemeProvider (attribute="class", defaultTheme="dark", enableSystem)
│       ├── QueryProvider (Singleton QueryClient with clearQueryClient support)
│       ├── AdminAuthProvider (Restores admin session via adminAuthApi.refreshToken)
│       ├── AdminSocketProvider (Authenticated-only connection; guarded by isAuthenticated && admin)
│       ├── TooltipProvider (Global accessible tooltip container)
│       ├── Toaster (Sonner notification container)
│       └── AdminLayout [Client Component: Navigation Shell Manager]
│           ├── Branch A: Public Path (/login)
│           │   └── <main id="admin-main" tabIndex={-1} className="min-h-screen">
│           │       └── {children} [No sidebar, no header, no protected route gate]
│           └── Branch B: Protected Paths (/products, /orders, /inventory, etc.)
│               └── AdminProtectedRoute [Client Guard: checks isAuthenticated & admin role]
│                   ├── SkipToContent Link (<a href="#admin-main" class="sr-only focus:not-sr-only">)
│                   ├── AdminSidebar (Responsive navigation drawer with collapsed/expanded states)
│                   └── Container (flex flex-1 flex-col min-w-0)
│                       ├── AdminHeader (Breadcrumbs, search, socket status indicator, UserMenu)
│                       └── <main id="admin-main" tabIndex={-1} className="flex-1 overflow-y-auto">
│                           └── {children} [Route-specific page content]
```

---

## 3. Separation of Public Auth vs. Protected Shell

A core architectural requirement is ensuring that the `/login` route never accidentally renders authenticated chrome (sidebar, top header, breadcrumbs, user avatar) or initializes background authenticated operations.

### Clean Boundary in `AdminLayout`

```tsx
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <main id="admin-main" tabIndex={-1} className="min-h-screen outline-none">
        {children}
      </main>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-background text-foreground">
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:shadow-md focus:ring-2 focus:ring-primary focus:rounded-md text-xs font-medium"
        >
          Skip to administrative content
        </a>
        <AdminSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <AdminHeader />
          <main id="admin-main" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
            {children}
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
```

### Benefits

1. **Single Mounting of Navigation:** Neither `AdminSidebar` nor `AdminHeader` is mounted multiple times or duplicated across child pages.
2. **Zero Chrome on Login:** When unauthenticated operators visit `/login`, only the login form card is mounted.
3. **Route Guarding:** Unauthenticated requests to any dashboard route are intercepted by `AdminProtectedRoute` and redirected to `/login?redirect=...`.

---

## 4. Provider Architecture & Operator Cache Isolation

### 1. `AdminSocketProvider` Scoping & Cleanup

- **Previous Vulnerability:** The admin socket connection connected unconditionally upon initial provider mount, even if the visitor was unauthenticated on `/login`.
- **Standardized Implementation:**
  ```tsx
  export function AdminSocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = React.useState<Socket | null>(null);
    const [isConnected, setIsConnected] = React.useState(false);
    const { admin, isAuthenticated } = useAdminAuthStore();
    const queryClient = useQueryClient();

    React.useEffect(() => {
      // Only connect when authenticated with an active admin session
      if (!isAuthenticated || !admin) {
        if (socket) {
          socket.disconnect();
          setSocket(null);
          setIsConnected(false);
        }
        return;
      }
      ...
  ```
- **Cleanup on Unmount:** Calling `socket.disconnect()` on provider unmount ensures no lingering WebSocket connections or duplicate listeners.

### 2. QueryClient Cache Invalidation

- **Implementation:** `apps/admin/src/lib/api/query-client.ts`
- Added `clearQueryClient()` method.
- **Zustand Store Integration:** `useAdminAuthStore.clearAdminAuth()` and `setUnauthenticated()` invoke `clearQueryClient()`.
- **Security Impact:** When an administrator logs out, all sensitive data (revenue statistics, customer dossiers, order totals, staff lists) are purged immediately from memory.

---

## 5. Accessibility Improvements & Landmarks

1. **Skip to Administrative Content:**
   - Added skip link targeting `#admin-main`.
   - Allows keyboard-only operators and screen readers to bypass the 12-item navigation sidebar directly to page tables and action buttons.
2. **Semantic Main Landmark:**
   - Both login (`min-h-screen`) and dashboard (`flex-1 overflow-y-auto`) render with `id="admin-main"` and `tabIndex={-1}`.
3. **Keyboard Accessible Sidebar:**
   - All navigation items render as accessible semantic `<a>` links within `<nav>`, maintaining focus rings and accessible labels.

---

## 6. Metadata Ownership & Search Engine Blocking

- **Layout Metadata:**
  ```typescript
  export const metadata: Metadata = {
    title: {
      default: "Veyora — Administration Portal",
      template: "%s | Veyora Administration",
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
  ```
- **Dynamic Robots Handler:** `apps/admin/src/app/robots.ts` serves `/robots.txt` disallowing all user agents from all routes.

---

## 7. Verification Results

- **Unit Tests:** `npm run test --workspace=@veyora/admin` passed 7/7 test files (23 tests passed, including new layout shell, skip link, error boundary, and cache isolation tests).
- **TypeScript Check:** `npm run typecheck` passed with code `0` across all monorepo packages.
- **Production Build:** `cd apps/admin && npx next build --webpack` passed with code `0`. All 21 routes + `_not-found` + `robots.txt` compiled cleanly.
