import { PermissionDefinition } from "@veyora/types";

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Products
  {
    key: "products:read",
    label: "View Products",
    description: "View product catalog, atelier apparel, variants, and specifications.",
    category: "products",
  },
  {
    key: "products:write",
    label: "Manage Products",
    description: "Create, edit, and publish products, garments, and product media.",
    category: "products",
  },
  {
    key: "products:delete",
    label: "Delete Products",
    description: "Permanently delete products from the catalog.",
    category: "products",
  },

  // Categories
  {
    key: "categories:read",
    label: "View Categories",
    description: "Browse fashion categories, couture taxonomies, and hierarchies.",
    category: "categories",
  },
  {
    key: "categories:write",
    label: "Manage Categories",
    description: "Create, edit, organize, and reorder fashion categories.",
    category: "categories",
  },
  {
    key: "categories:delete",
    label: "Delete Categories",
    description: "Remove categories and taxonomies.",
    category: "categories",
  },

  // Inventory
  {
    key: "inventory:read",
    label: "View Inventory",
    description: "Inspect atelier stock levels, warehouse allocations, and low stock warnings.",
    category: "inventory",
  },
  {
    key: "inventory:write",
    label: "Manage Inventory",
    description: "Adjust stock counts, reserve inventory, and set low stock thresholds.",
    category: "inventory",
  },

  // Orders
  {
    key: "orders:read",
    label: "View Orders",
    description: "Access customer orders, fulfillment statuses, and tracking timelines.",
    category: "orders",
  },
  {
    key: "orders:write",
    label: "Manage Orders",
    description: "Update order details, modify line items, and add customer notes.",
    category: "orders",
  },
  {
    key: "orders:cancel",
    label: "Cancel Orders",
    description: "Cancel active client orders and initiate cancellations.",
    category: "orders",
  },
  {
    key: "orders:update_status",
    label: "Update Order Status",
    description: "Transition orders through confirmed, processing, shipped, and delivered states.",
    category: "orders",
  },

  // Customers
  {
    key: "customers:read",
    label: "View Customers",
    description: "Access registered customer profiles, patron dossiers, and purchase histories.",
    category: "customers",
  },
  {
    key: "customers:write",
    label: "Manage Customers",
    description: "Update customer records, internal flags, notes, and account statuses.",
    category: "customers",
  },

  // Payments
  {
    key: "payments:read",
    label: "View Payments",
    description: "Inspect payment transactions, gateway audit records, and receipt logs.",
    category: "payments",
  },
  {
    key: "payments:refund",
    label: "Issue Refunds",
    description: "Initiate and verify transaction refunds via payment gateway.",
    category: "payments",
  },

  // Coupons
  {
    key: "coupons:read",
    label: "View Coupons",
    description: "Inspect promotional codes, discount rules, and usage metrics.",
    category: "coupons",
  },
  {
    key: "coupons:write",
    label: "Manage Coupons",
    description: "Create, update, activate, and deactivate promotional campaigns.",
    category: "coupons",
  },
  {
    key: "coupons:delete",
    label: "Delete Coupons",
    description: "Permanently delete promotional coupons.",
    category: "coupons",
  },

  // Analytics
  {
    key: "analytics:read",
    label: "View Analytics & Dashboard",
    description: "Access executive revenue overviews, conversion charts, and operational KPIs.",
    category: "analytics",
  },

  // Settings
  {
    key: "settings:read",
    label: "View System Settings",
    description: "Read store settings, platform configurations, and operational parameters.",
    category: "settings",
  },
  {
    key: "settings:write",
    label: "Manage System Settings",
    description: "Modify platform configurations, currency parameters, and integrations.",
    category: "settings",
  },

  // Staff & Team
  {
    key: "staff:read",
    label: "View Staff Members",
    description: "List administrative staff, team members, and their assigned roles.",
    category: "staff",
  },
  {
    key: "staff:write",
    label: "Manage Staff Members",
    description: "Invite staff, update team dossiers, and assign roles & permissions.",
    category: "staff",
  },
  {
    key: "staff:delete",
    label: "Delete Staff Members",
    description: "Deactivate or delete administrative staff accounts.",
    category: "staff",
  },

  // Roles & Permissions
  {
    key: "roles:read",
    label: "View Roles & Permissions",
    description: "Inspect administrative roles, permission matrices, and access privileges.",
    category: "roles",
  },
  {
    key: "roles:write",
    label: "Manage Roles",
    description: "Create, edit, and configure custom administrative roles.",
    category: "roles",
  },
  {
    key: "roles:delete",
    label: "Delete Roles",
    description: "Delete non-system custom administrative roles.",
    category: "roles",
  },

  // Audit Logs
  {
    key: "audit:read",
    label: "View Audit Logs",
    description: "Inspect system security events, administrative audit trails, and access logs.",
    category: "audit",
  },
];

/**
 * Check whether a user's granted permissions satisfy a required permission.
 * Supports:
 * - Superadmin wildcard `*` or `manage:all`
 * - Domain wildcard (e.g. `products:*` satisfies `products:read`, `products:write`, `products:delete`)
 * - Write implies Read (e.g. `products:write` satisfies `products:read`)
 * - Legacy alias mappings (e.g. `manage:catalog`, `manage:orders`, `manage:coupons`, `read:users`, etc.)
 */
export function hasPermission(grantedPermissions: string[], required: string): boolean {
  if (!grantedPermissions || grantedPermissions.length === 0) {
    return false;
  }

  // 1. Wildcard match
  if (grantedPermissions.includes("*") || grantedPermissions.includes("manage:all")) {
    return true;
  }

  // 2. Exact match
  if (grantedPermissions.includes(required)) {
    return true;
  }

  const [reqDomain, reqAction] = required.split(":");

  // 3. Domain wildcard match (e.g. "products:*" matches "products:read")
  if (reqDomain && grantedPermissions.includes(`${reqDomain}:*`)) {
    return true;
  }

  // 4. Write implies Read
  if (reqAction === "read" && reqDomain) {
    if (grantedPermissions.includes(`${reqDomain}:write`)) {
      return true;
    }
  }

  // 5. Orders specific transitions
  if (reqDomain === "orders") {
    if (reqAction === "update_status" || reqAction === "cancel") {
      if (grantedPermissions.includes("orders:write")) {
        return true;
      }
    }
  }

  // 6. Legacy compatibility aliases
  const legacyAliases: Record<string, string[]> = {
    "products:read": ["manage:catalog", "catalog:manage", "read:catalog"],
    "products:write": ["manage:catalog", "catalog:manage"],
    "products:delete": ["manage:catalog", "catalog:manage"],
    "categories:read": ["manage:catalog", "catalog:manage", "read:catalog"],
    "categories:write": ["manage:catalog", "catalog:manage"],
    "categories:delete": ["manage:catalog", "catalog:manage"],
    "inventory:read": ["manage:inventory", "inventory:manage"],
    "inventory:write": ["manage:inventory", "inventory:manage"],
    "orders:read": ["manage:orders", "orders:manage"],
    "orders:write": ["manage:orders", "orders:manage"],
    "orders:cancel": ["manage:orders", "orders:manage"],
    "orders:update_status": ["manage:orders", "orders:manage"],
    "customers:read": ["read:users", "write:users", "manage:customers"],
    "customers:write": ["write:users", "manage:customers"],
    "payments:read": ["manage:payments", "payments:manage"],
    "payments:refund": ["manage:payments", "payments:manage"],
    "coupons:read": ["manage:coupons", "coupons:manage"],
    "coupons:write": ["manage:coupons", "coupons:manage"],
    "coupons:delete": ["manage:coupons", "coupons:manage"],
    "analytics:read": ["read:analytics", "manage:dashboard"],
    "shipping:read": ["manage:shipping", "manage:orders", "orders:manage"],
    "shipping:write": ["manage:shipping", "manage:orders", "orders:manage"],
    "settings:read": ["read:system", "manage:system"],
    "settings:write": ["manage:system"],
    "staff:read": ["read:users", "write:users", "manage:system"],
    "staff:write": ["write:users", "manage:system"],
    "staff:delete": ["manage:system"],
    "roles:read": ["manage:system"],
    "roles:write": ["manage:system"],
    "roles:delete": ["manage:system"],
    "audit:read": ["manage:system"],
  };

  const aliases = legacyAliases[required];
  if (aliases && aliases.some((alias) => grantedPermissions.includes(alias))) {
    return true;
  }

  return false;
}
