import { Socket } from "socket.io";
import { tokenService } from "../../modules/auth/services/token.service";
import { Session } from "../../modules/auth/models/session.model";
import { logger } from "../../config/logger";
import { UserRole, UserPermission } from "@veyora/types";

export interface AuthenticatedSocketUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: UserPermission[];
}

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    // 1. Extract token from auth payload, header, or query
    const authHeader = socket.handshake.headers.authorization;
    let token = socket.handshake.auth?.["token"] || (socket.handshake.query?.["token"] as string);

    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return next(new Error("Authentication failed: No token provided"));
    }

    // 2. Verify JWT signature & expiration
    let payload;
    try {
      payload = tokenService.verifyAccessToken(token);
    } catch {
      return next(new Error("Authentication failed: Invalid or expired token"));
    }

    // 3. Verify session active & not revoked in database
    const session = await Session.findById(payload.sessionId);
    if (!session || session.isRevoked || session.expiresAt.getTime() < Date.now()) {
      return next(new Error("Authentication failed: Session expired or revoked"));
    }

    // 4. Attach verified user context to socket (never trusting client parameters)
    socket.data.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
      permissions: (payload.permissions || []) as UserPermission[],
    };

    logger.debug(
      { socketId: socket.id, userId: payload.sub, role: payload.role },
      "Socket connection authenticated successfully"
    );

    next();
  } catch (error) {
    logger.warn({ error: (error as Error).message }, "Socket authentication rejected");
    next(new Error("Authentication failed: Unauthorized connection"));
  }
}
