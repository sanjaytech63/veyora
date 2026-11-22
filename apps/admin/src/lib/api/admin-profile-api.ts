import { apiClient } from "./api-client";
import { UserProfileDto, ProfileCompletionDto, AvatarUploadSignatureResponse } from "@veyora/types";
import { UpdateProfileInput, UpdateAvatarInput } from "@veyora/validators";

export const adminProfileApi = {
  getProfile: () => apiClient.get<UserProfileDto>("/profile"),

  updateProfile: (data: UpdateProfileInput) => apiClient.patch<UserProfileDto>("/profile", data),

  getAvatarUploadSignature: () =>
    apiClient.post<AvatarUploadSignatureResponse>("/profile/avatar/upload-signature"),

  updateAvatar: (data: UpdateAvatarInput) =>
    apiClient.patch<UserProfileDto>("/profile/avatar", data),

  removeAvatar: () => apiClient.delete<UserProfileDto>("/profile/avatar"),

  getCompletion: () => apiClient.get<ProfileCompletionDto>("/profile/completion"),
};
