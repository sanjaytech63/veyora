/**
 * Authentication & Authorization Types for Veyora
 */

export type UserRole = "customer" | "admin" | "superadmin";

export type UserPermission =
  | "read:users"
  | "write:users"
  | "read:system"
  | "manage:system"
  | "manage:catalog"
  | "manage:orders"
  | (string & {});

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: UserPermission[];
  isEmailVerified: boolean;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: UserPermission[];
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponseData {
  user: AuthUser;
  accessToken: string;
  isEmailVerified?: boolean;
}

export type OtpType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

export interface SessionInfo {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent?: boolean;
}
