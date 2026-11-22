import { IUser } from "../auth/models/user.model";
import { UserProfileDto } from "@veyora/types";
import { calculateProfileCompletion } from "@veyora/utils";

export class ProfileMapper {
  public static toDto(user: IUser): UserProfileDto {
    const profileCompletion = calculateProfileCompletion({
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

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName || null,
      phone: user.phone || null,
      role: user.role,
      avatar:
        user.avatar && user.avatar.secureUrl
          ? {
              publicId: user.avatar.publicId,
              secureUrl: user.avatar.secureUrl,
              width: user.avatar.width,
              height: user.avatar.height,
              format: user.avatar.format,
              bytes: user.avatar.bytes,
            }
          : null,
      bio: user.bio || null,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
      gender: user.gender || null,
      preferences: {
        language: user.preferences?.language || "en",
        timezone: user.preferences?.timezone || "UTC",
      },
      isEmailVerified: Boolean(user.isEmailVerified),
      isActive: Boolean(user.isActive),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profileCompletion,
    };
  }
}
