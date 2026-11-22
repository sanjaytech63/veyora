import { UserRole } from "./auth";

/**
 * Cloudinary Avatar Metadata
 */
export interface UserAvatarDto {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

/**
 * User Profile Preferences
 */
export interface UserPreferencesDto {
  language?: string;
  timezone?: string;
}

/**
 * Profile Completion Breakdown Item
 */
export interface ProfileCompletionItem {
  key: string;
  label: string;
  isCompleted: boolean;
  weight: number;
}

/**
 * Profile Completion Metrics
 */
export interface ProfileCompletionDto {
  percentage: number;
  completedItems: string[];
  remainingItems: string[];
  items: ProfileCompletionItem[];
  isComplete: boolean;
}

/**
 * Complete Safe User Profile Representation
 */
export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  phone?: string | null;
  role: UserRole;
  avatar?: UserAvatarDto | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  preferences?: UserPreferencesDto;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  profileCompletion: ProfileCompletionDto;
}

/**
 * Signed Upload Parameters for Client Cloudinary Uploads
 */
export interface AvatarUploadSignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  allowedFormats: string[];
  maxFileSize: number;
  publicId: string;
  tags: string[];
}
