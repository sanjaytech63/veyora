import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { UserRole, UserPermission } from "@veyora/types";
import { UnauthorizedError, ForbiddenError } from "@veyora/utils";
import { tokenService } from "../modules/auth/services/token.service";
import { Session } from "../modules/auth/models/session.model";

/**
 * Enforce valid Bearer Access Token and active, unrevoked session
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is required.");
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError("Malformed authentication token.");
    }

    let payload;
    try {
      payload = tokenService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired authentication token.");
    }

    // Check if session is active and not revoked
    const session = await Session.findById(payload.sessionId);
    if (!session || session.isRevoked || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError("Session has expired or was revoked. Please log in again.");
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      firstName: "",
      lastName: "",
      role: payload.role,
      permissions: payload.permissions || [],
      isEmailVerified: true,
    };
    req.sessionId = payload.sessionId;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional Authentication: identifies authenticated user if valid token present,
 * otherwise resolves or assigns a guest identifier (x-guest-id or cookie).
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) {
        try {
          const payload = tokenService.verifyAccessToken(token);
          const session = await Session.findById(payload.sessionId);
          if (session && !session.isRevoked && session.expiresAt.getTime() >= Date.now()) {
            req.user = {
              id: payload.sub,
              email: payload.email,
              firstName: "",
              lastName: "",
              role: payload.role,
              permissions: payload.permissions || [],
              isEmailVerified: true,
            };
            req.sessionId = payload.sessionId;
          }
        } catch {
          // Token expired or invalid - ignore for optional auth, fallback to guest
        }
      }
    }

    // Resolve or assign guest ID if unauthenticated
    const headerGuestId = (req.headers["x-guest-id"] as string) || (req.cookies && (req.cookies as Record<string, string>)["guest_id"]);
    if (headerGuestId && headerGuestId.trim()) {
      req.guestId = headerGuestId.trim();
    } else if (!req.user) {
      req.guestId = randomUUID();
      res.setHeader("x-guest-id", req.guestId);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control (RBAC) middleware
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden. Requires one of the following roles: [${allowedRoles.join(", ")}].`
        )
      );
    }

    next();
  };
}

/**
 * Permission-Based Access Control (PBAC) middleware
 */
export function requirePermission(...requiredPermissions: UserPermission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    // Superadmin bypasses specific permission checks
    if (req.user.role === "superadmin") {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return next(
        new ForbiddenError(
          `Access forbidden. Missing required permissions: [${requiredPermissions.join(", ")}].`
        )
      );
    }

    next();
  };
}
