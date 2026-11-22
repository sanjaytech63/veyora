"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, Trash2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadAvatar, useRemoveAvatar } from "@/hooks/use-profile";
import { UserAvatarDto } from "@veyora/types";

interface ProfileAvatarProps {
  avatar?: UserAvatarDto | null;
  firstName?: string;
  lastName?: string;
}

export function ProfileAvatar({ avatar, firstName = "", lastName = "" }: ProfileAvatarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const uploadAvatarMutation = useUploadAvatar();
  const removeAvatarMutation = useRemoveAvatar();

  const isUploading = uploadAvatarMutation.isPending;
  const isRemoving = removeAvatarMutation.isPending;
  const isLoading = isUploading || isRemoving;

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "V";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatarMutation.mutate(file, {
        onSettled: () => {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative group">
        <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden ring-4 ring-border/80 bg-muted flex items-center justify-center shadow-md">
          {avatar?.secureUrl ? (
            <Image
              src={avatar.secureUrl}
              alt={`${firstName} ${lastName} avatar`}
              fill
              sizes="(max-width: 640px) 112px, 128px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
            />
          ) : (
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-muted-foreground select-none">
              {initials}
            </span>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center z-10">
              <LoaderCircle className="h-7 w-7 text-primary animate-spin" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          aria-label="Upload profile image"
          className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Camera className="h-4 w-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="space-y-2 text-center sm:text-left">
        <h3 className="text-base font-semibold text-foreground">Profile Picture</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Upload a high-resolution photo in JPG, PNG, or WebP format. Maximum file size is 5MB.
        </p>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="text-xs h-8 rounded-lg cursor-pointer"
          >
            {isUploading ? (
              <>
                <LoaderCircle className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                Change Photo
              </>
            )}
          </Button>

          {avatar?.secureUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeAvatarMutation.mutate()}
              disabled={isLoading}
              className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
            >
              {isRemoving ? (
                <>
                  <LoaderCircle className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Remove
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
