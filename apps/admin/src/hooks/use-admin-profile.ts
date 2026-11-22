"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminProfileApi } from "@/lib/api/admin-profile-api";
import { profileKeys } from "@/lib/api/query-keys";
import { UserProfileDto, ProfileCompletionDto, AvatarUploadSignatureResponse } from "@veyora/types";
import { UpdateProfileInput, UpdateAvatarInput } from "@veyora/validators";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/stores/admin-auth-store";

export function useAdminProfile() {
  const { isAuthenticated } = useAdminAuthStore();

  return useQuery<UserProfileDto>({
    queryKey: profileKeys.current(),
    queryFn: () => adminProfileApi.getProfile(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useAdminProfileCompletion() {
  const { isAuthenticated } = useAdminAuthStore();

  return useQuery<ProfileCompletionDto>({
    queryKey: profileKeys.completion(),
    queryFn: () => adminProfileApi.getCompletion(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();
  const { setAdmin, admin } = useAdminAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => adminProfileApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.current(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.all });

      // Keep light admin auth store names in sync
      if (admin) {
        setAdmin({
          ...admin,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
        });
      }

      toast.success("Administrator Profile Updated", {
        description: "Your staff profile information has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Profile Update Failed", {
        description: error.message || "Failed to update staff profile.",
      });
    },
  });
}

export function useUploadAdminAvatar() {
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
        await adminProfileApi.getAvatarUploadSignature();

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

      return adminProfileApi.updateAvatar(avatarPayload);
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.current(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success("Profile Avatar Updated", {
        description: "Your administrator avatar has been uploaded and applied.",
      });
    },
    onError: (error: Error) => {
      toast.error("Avatar Upload Failed", {
        description: error.message || "Failed to upload and apply profile photo.",
      });
    },
  });
}

export function useRemoveAdminAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminProfileApi.removeAvatar(),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.current(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success("Avatar Removed", {
        description: "Your administrator avatar has been removed.",
      });
    },
    onError: (error: Error) => {
      toast.error("Avatar Removal Failed", {
        description: error.message || "Failed to remove avatar image.",
      });
    },
  });
}
