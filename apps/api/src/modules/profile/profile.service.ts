import { User } from "../auth/models/user.model";
import {
  UserProfileDto,
  ProfileCompletionDto,
  AvatarUploadSignatureResponse,
  ApiProfileCode,
} from "@veyora/types";
import { UpdateProfileInput, UpdateAvatarInput } from "@veyora/validators";
import { NotFoundError } from "@veyora/utils";
import { ProfileMapper } from "./profile.mapper";
import { cloudinaryService } from "../../infrastructure/cloudinary/cloudinary.service";
import { calculateProfileCompletion } from "@veyora/utils";
import { logger } from "../../config/logger";

export class ProfileService {
  /**
   * Retrieves the authenticated user's complete profile
   */
  public async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundError(
        "Profile not found or account is deactivated.",
        undefined,
        ApiProfileCode.PROFILE_NOT_FOUND
      );
    }
    return ProfileMapper.toDto(user);
  }

  /**
   * Updates permitted profile information using a strict field allowlist.
   * Completely prevents tampering with security-sensitive attributes.
   */
  public async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfileDto> {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundError(
        "Profile not found or account is deactivated.",
        undefined,
        ApiProfileCode.PROFILE_NOT_FOUND
      );
    }

    if (input.firstName !== undefined) {
      user.firstName = input.firstName.trim();
    }

    if (input.lastName !== undefined) {
      user.lastName = input.lastName.trim();
    }

    if (input.displayName !== undefined) {
      user.displayName = input.displayName ? input.displayName.trim() : null;
    }

    if (input.phone !== undefined) {
      user.phone = input.phone ? input.phone.trim() : null;
    }

    if (input.bio !== undefined) {
      user.bio = input.bio ? input.bio.trim() : null;
    }

    if (input.dateOfBirth !== undefined) {
      user.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
    }

    if (input.gender !== undefined) {
      user.gender = input.gender;
    }

    if (input.preferences !== undefined) {
      user.preferences = {
        language: input.preferences.language || user.preferences?.language || "en",
        timezone: input.preferences.timezone || user.preferences?.timezone || "UTC",
      };
    }

    await user.save();

    logger.info(
      { userId: user._id.toString(), email: user.email },
      "User profile details updated successfully."
    );

    return ProfileMapper.toDto(user);
  }

  /**
   * Generates secure signed upload authorization parameters for Cloudinary
   */
  public getAvatarUploadSignature(userId: string, role: string): AvatarUploadSignatureResponse {
    return cloudinaryService.generateUploadSignature(userId, role);
  }

  /**
   * Validates and attaches uploaded Cloudinary asset metadata to the user's profile
   */
  public async updateAvatar(
    userId: string,
    input: UpdateAvatarInput,
    role: string
  ): Promise<UserProfileDto> {
    // 1. Validate asset metadata and ownership boundary
    cloudinaryService.validateAssetMetadata(input, userId, role);

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundError(
        "Profile not found or account is deactivated.",
        undefined,
        ApiProfileCode.PROFILE_NOT_FOUND
      );
    }

    // 2. Schedule deletion of previous avatar if replacing
    const oldPublicId = user.avatar?.publicId;
    if (oldPublicId && oldPublicId !== input.publicId) {
      cloudinaryService.deleteAsset(oldPublicId).catch((err) => {
        logger.error(
          { oldPublicId, error: (err as Error).message },
          "Failed to delete previous avatar asset from Cloudinary"
        );
      });
    }

    // 3. Persist new avatar metadata
    user.avatar = {
      publicId: input.publicId,
      secureUrl: input.secureUrl,
      width: input.width,
      height: input.height,
      format: input.format,
      bytes: input.bytes,
    };

    await user.save();

    logger.info(
      { userId: user._id.toString(), publicId: input.publicId },
      "Profile avatar attached and saved successfully."
    );

    return ProfileMapper.toDto(user);
  }

  /**
   * Removes avatar from user profile and triggers safe asset deletion
   */
  public async removeAvatar(userId: string): Promise<UserProfileDto> {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundError(
        "Profile not found or account is deactivated.",
        undefined,
        ApiProfileCode.PROFILE_NOT_FOUND
      );
    }

    const oldPublicId = user.avatar?.publicId;

    // Remove from DB first
    user.avatar = null;
    await user.save();

    // Trigger Cloudinary destruction safely
    if (oldPublicId) {
      cloudinaryService.deleteAsset(oldPublicId).catch((err) => {
        logger.error(
          { oldPublicId, error: (err as Error).message },
          "Failed to delete removed avatar asset from Cloudinary"
        );
      });
    }

    logger.info(
      { userId: user._id.toString(), oldPublicId },
      "Profile avatar removed successfully."
    );

    return ProfileMapper.toDto(user);
  }

  /**
   * Computes profile completion metrics for the user
   */
  public async getProfileCompletion(userId: string): Promise<ProfileCompletionDto> {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundError(
        "Profile not found or account is deactivated.",
        undefined,
        ApiProfileCode.PROFILE_NOT_FOUND
      );
    }

    return calculateProfileCompletion({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      phone: user.phone,
      avatar: user.avatar ? { secureUrl: user.avatar.secureUrl } : null,
      bio: user.bio,
      displayName: user.displayName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
    });
  }
}

export const profileService = new ProfileService();
