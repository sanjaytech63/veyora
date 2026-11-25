import { Request, Response, NextFunction } from "express";
import { ApiProfileCode } from "@veyora/types";
import { profileService } from "./profile.service";
import { UnauthorizedError } from "@veyora/utils";
import { sendSuccess } from "../../utils/response";

export class ProfileController {
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }
      const profile = await profileService.getProfile(req.user.id);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiProfileCode.PROFILE_FETCHED,
        message: "Profile retrieved successfully.",
        data: profile,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }
      const profile = await profileService.updateProfile(req.user.id, req.body);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiProfileCode.PROFILE_UPDATED,
        message: "Profile updated successfully.",
        data: profile,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAvatarUploadSignature(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }
      const signatureData = profileService.getAvatarUploadSignature(req.user.id, req.user.role);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiProfileCode.AVATAR_SIGNATURE_GENERATED,
        message: "Avatar upload signature generated successfully.",
        data: signatureData,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }
      const profile = await profileService.updateAvatar(req.user.id, req.body, req.user.role);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiProfileCode.AVATAR_UPDATED,
        message: "Profile avatar updated successfully.",
        data: profile,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  public async removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }
      const profile = await profileService.removeAvatar(req.user.id);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiProfileCode.AVATAR_REMOVED,
        message: "Profile avatar removed successfully.",
        data: profile,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  public async getProfileCompletion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }
      const completion = await profileService.getProfileCompletion(req.user.id);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiProfileCode.PROFILE_COMPLETION_FETCHED,
        message: "Profile completion metrics retrieved successfully.",
        data: completion,
        extra: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
