import { UserRole } from "./auth";

/**
 * Granular Administrative Permission Keys
 */
export type StandardPermission =
  // Products
  | "products:read"
  | "products:write"
  | "products:delete"
  // Categories
  | "categories:read"
  | "categories:write"
  | "categories:delete"
  // Inventory
  | "inventory:read"
  | "inventory:write"
  // Orders
  | "orders:read"
  | "orders:write"
  | "orders:cancel"
  | "orders:update_status"
  // Customers
  | "customers:read"
  | "customers:write"
  // Payments
  | "payments:read"
  | "payments:refund"
  // Coupons
  | "coupons:read"
  | "coupons:write"
  | "coupons:delete"
  // Analytics
  | "analytics:read"
  // Settings
  | "settings:read"
  | "settings:write"
  // Staff & Team Management
  | "staff:read"
  | "staff:write"
  | "staff:delete"
  // Roles & Permissions Management
  | "roles:read"
  | "roles:write"
  | "roles:delete"
  // Security & Audit
  | "audit:read";

export type PermissionKey = StandardPermission | (string & {});

export interface PermissionDefinition {
  key: StandardPermission;
  label: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory =
  | "products"
  | "categories"
  | "inventory"
  | "orders"
  | "customers"
  | "payments"
  | "coupons"
  | "analytics"
  | "settings"
  | "staff"
  | "roles"
  | "audit";

export interface RoleDto {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  staffCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StaffUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  assignedRoleIds: string[];
  assignedRoles: RoleDto[];
  customPermissions: string[];
  effectivePermissions: string[];
  isActive: boolean;
  statusReason?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogDto {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface CreateRoleInput {
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  displayName?: string;
  description?: string;
  permissions?: string[];
}

export interface CreateStaffUserInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  assignedRoleIds?: string[];
  customPermissions?: string[];
}

export interface UpdateStaffUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  assignedRoleIds?: string[];
  customPermissions?: string[];
  isActive?: boolean;
}

export interface StaffListQuery {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface AuditLogListQuery {
  actorId?: string;
  resource?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
