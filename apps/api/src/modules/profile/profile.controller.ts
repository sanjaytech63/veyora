import { Request, Response, NextFunction } from "express";
import { profileService } from "./profile.service";
import { UnauthorizedError } from "@veyora/utils";

export class ProfileController {
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }
      const profile = await profileService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: profile,
        timestamp: new Date().toISOString(),
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
      res.status(200).json({
        success: true,
        data: profile,
        message: "Profile updated successfully.",
        timestamp: new Date().toISOString(),
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
      res.status(200).json({
        success: true,
        data: signatureData,
        timestamp: new Date().toISOString(),
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
      res.status(200).json({
        success: true,
        data: profile,
        message: "Profile avatar updated successfully.",
        timestamp: new Date().toISOString(),
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
      res.status(200).json({
        success: true,
        data: profile,
        message: "Profile avatar removed successfully.",
        timestamp: new Date().toISOString(),
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
      res.status(200).json({
        success: true,
        data: completion,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
