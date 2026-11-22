"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profile-api";
import { profileKeys } from "@/lib/api/query-keys";
import { UserProfileDto, ProfileCompletionDto, AvatarUploadSignatureResponse } from "@veyora/types";
import { UpdateProfileInput, UpdateAvatarInput } from "@veyora/validators";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery<UserProfileDto>({
    queryKey: profileKeys.current(),
    queryFn: () => profileApi.getProfile(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useProfileCompletion() {
  const { isAuthenticated } = useAuthStore();

  return useQuery<ProfileCompletionDto>({
    queryKey: profileKeys.completion(),
    queryFn: () => profileApi.getCompletion(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser, user } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => profileApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.current(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.all });

      // Keep light auth store names in sync
      if (user) {
        setUser({
          ...user,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
        });
      }

      toast.success("Profile updated", {
        description: "Your personal details have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Update failed", {
        description: error.message || "Failed to update profile details.",
      });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // 1. Client file validation
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Invalid file format. Please upload a JPEG, PNG, or WebP image.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size exceeds 5MB. Please choose a smaller image.");
      }

      // 2. Request authorized signed upload params from backend
      const signatureData: AvatarUploadSignatureResponse =
        await profileApi.getAvatarUploadSignature();

      // 3. Post directly to Cloudinary CDN via signed parameters
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", String(signatureData.timestamp));
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder);
      const publicIdShort = signatureData.publicId.split("/").pop() || `avatar_${Date.now()}`;
      formData.append("public_id", publicIdShort);
      formData.append("tags", signatureData.tags.join(","));

      const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;
      const cloudinaryRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!cloudinaryRes.ok) {
        const errorJson = await cloudinaryRes.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || "Cloudinary upload service failed.");
      }

      const uploadResult = await cloudinaryRes.json();

      // 4. Attach verified asset metadata to user profile via API
      const avatarPayload: UpdateAvatarInput = {
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      };

      return profileApi.updateAvatar(avatarPayload);
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.current(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success("Avatar updated", {
        description: "Your new profile picture has been uploaded and applied.",
      });
    },
    onError: (error: Error) => {
      toast.error("Avatar upload failed", {
        description: error.message || "Failed to upload and apply profile photo.",
      });
    },
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileApi.removeAvatar(),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.current(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success("Avatar removed", {
        description: "Your profile picture has been reset to default.",
      });
    },
    onError: (error: Error) => {
      toast.error("Removal failed", {
        description: error.message || "Failed to remove profile picture.",
      });
    },
  });
}
