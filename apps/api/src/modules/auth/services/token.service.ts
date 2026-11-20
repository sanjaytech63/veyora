import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AuthTokens, JwtAccessPayload } from "@veyora/types";
import { env } from "../../../config/env";
import { IUser } from "../models/user.model";

export class TokenService {
  generateTokens(user: IUser, sessionId: string, familyId: string): AuthTokens {
    const accessPayload: JwtAccessPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      sessionId,
    };

    // Calculate numeric expiry seconds for response
    const accessExpiryMatch = env.JWT_ACCESS_EXPIRES_IN.match(/^(\d+)([smhd])$/);
    let expiresIn = 900; // default 15m (900s)
    if (accessExpiryMatch && accessExpiryMatch[1] && accessExpiryMatch[2]) {
      const val = parseInt(accessExpiryMatch[1], 10);
      const unit = accessExpiryMatch[2];
      if (unit === "s") expiresIn = val;
      else if (unit === "m") expiresIn = val * 60;
      else if (unit === "h") expiresIn = val * 3600;
      else if (unit === "d") expiresIn = val * 86400;
    }

    const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number,
    });

    const refreshPayload = {
      sub: user._id.toString(),
      sessionId,
      familyId,
    };

    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: `${env.JWT_REFRESH_EXPIRES_IN_DAYS}d`,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
  }

  verifyRefreshToken(token: string): { sub: string; sessionId: string; familyId: string } {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      sub: string;
      sessionId: string;
      familyId: string;
    };
  }

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}

export const tokenService = new TokenService();
