"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, UpdateProfileInput } from "@veyora/validators";
import { UserProfileDto } from "@veyora/types";
import { useUpdateProfile } from "@/hooks/use-profile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Check, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface ProfileFormProps {
  profile: UserProfileDto;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const updateProfileMutation = useUpdateProfile();
  const isSubmitting = updateProfileMutation.isPending;

  const defaultValues: UpdateProfileInput = {
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    displayName: profile.displayName || "",
    phone: profile.phone || "",
    bio: profile.bio || "",
    gender: profile.gender || undefined,
    preferences: {
      language: profile.preferences?.language || "en",
      timezone: profile.preferences?.timezone || "UTC",
    },
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  // Re-sync form default values if remote profile changes
  React.useEffect(() => {
    reset({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      displayName: profile.displayName || "",
      phone: profile.phone || "",
      bio: profile.bio || "",
      gender: profile.gender || undefined,
      preferences: {
        language: profile.preferences?.language || "en",
        timezone: profile.preferences?.timezone || "UTC",
      },
    });
  }, [profile, reset]);

  const onSubmit = (data: UpdateProfileInput) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Details Section */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold">Personal Information</CardTitle>
          <CardDescription className="text-xs">
            Manage your legal name and public display preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="text-xs font-semibold text-foreground">
                First Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="firstName"
                placeholder="First name"
                className="text-xs rounded-xl"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-[11px] text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-xs font-semibold text-foreground">
                Last Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="lastName"
                placeholder="Last name"
                className="text-xs rounded-xl"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-[11px] text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="displayName" className="text-xs font-semibold text-foreground">
              Display Name / Pseudonym
            </label>
            <Input
              id="displayName"
              placeholder="e.g. Priya K."
              className="text-xs rounded-xl"
              {...register("displayName")}
            />
            <p className="text-[10px] text-muted-foreground">
              Shown on your published garment reviews and community interactions.
            </p>
            {errors.displayName && (
              <p className="text-[11px] text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="gender" className="text-xs font-semibold text-foreground">
                Gender
              </label>
              <select
                id="gender"
                className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("gender")}
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="language" className="text-xs font-semibold text-foreground">
                Preferred Language
              </label>
              <select
                id="language"
                className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("preferences.language")}
              >
                <option value="en">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="fr">French (Français)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bio" className="text-xs font-semibold text-foreground">
              Personal Bio
            </label>
            <Textarea
              id="bio"
              rows={3}
              placeholder="Tell us about your sartorial tastes and styling interests..."
              className="text-xs rounded-xl resize-none"
              {...register("bio")}
            />
            {errors.bio && <p className="text-[11px] text-destructive">{errors.bio.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Contact & Security Information */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold">Contact Details</CardTitle>
          <CardDescription className="text-xs">
            Used for delivery tracking updates and order receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-foreground">
              Email Address
            </label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="text-xs rounded-xl bg-muted/50 cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground">
              To change your registered email, please verify identity through customer security.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-xs font-semibold text-foreground">
              Phone Number
            </label>
            <Input
              id="phone"
              placeholder="+91 9876543210"
              className="text-xs rounded-xl"
              {...register("phone")}
            />
            {errors.phone && <p className="text-[11px] text-destructive">{errors.phone.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => reset(defaultValues)}
          disabled={!isDirty || isSubmitting}
          className="text-xs h-9 rounded-xl cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset Changes
        </Button>

        <Button
          type="submit"
          size="sm"
          disabled={!isDirty || isSubmitting}
          className="text-xs h-9 rounded-xl px-5 cursor-pointer shadow-xs"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
