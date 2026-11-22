"use client";

import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, UpdateProfileInput } from "@veyora/validators";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminProfile,
  useUpdateAdminProfile,
  useUploadAdminAvatar,
  useRemoveAdminAvatar,
} from "@/hooks/use-admin-profile";
import {
  Camera,
  Trash2,
  Shield,
  ShieldCheck,
  Calendar,
  Mail,
  Check,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  LoaderCircle,
} from "lucide-react";

export default function AdminProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useAdminProfile();
  const updateProfileMutation = useUpdateAdminProfile();
  const uploadAvatarMutation = useUploadAdminAvatar();
  const removeAvatarMutation = useRemoveAdminAvatar();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isSaving = updateProfileMutation.isPending;
  const isUploading = uploadAvatarMutation.isPending;
  const isRemoving = removeAvatarMutation.isPending;
  const isAvatarLoading = isUploading || isRemoving;

  const defaultValues: UpdateProfileInput = {
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    displayName: profile?.displayName || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    preferences: {
      language: profile?.preferences?.language || "en",
      timezone: profile?.preferences?.timezone || "UTC",
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

  React.useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        displayName: profile.displayName || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        preferences: {
          language: profile.preferences?.language || "en",
          timezone: profile.preferences?.timezone || "UTC",
        },
      });
    }
  }, [profile, reset]);

  const onProfileSubmit = (data: UpdateProfileInput) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  if (isLoading) {
    return (
      <PageContainer
        title="Administrator Profile"
        description="Manage your staff profile, credentials overview, and display details."
      >
        <div className="space-y-6 max-w-5xl">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !profile) {
    return (
      <PageContainer
        title="Administrator Profile"
        description="Manage your staff profile, credentials overview, and display details."
      >
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">Unable to Load Staff Profile</h3>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "An error occurred retrieving administrator data."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="cursor-pointer text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || "AD";
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  return (
    <PageContainer
      title="Administrator Profile"
      description="Manage your staff identity, personal details, and avatar."
    >
      <div className="space-y-8 max-w-5xl">
        {/* Profile Header Card */}
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Photo Frame */}
              <div className="relative group shrink-0">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden ring-4 ring-border/80 bg-muted flex items-center justify-center shadow-md">
                  {profile.avatar?.secureUrl ? (
                    <Image
                      src={profile.avatar.secureUrl}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      fill
                      sizes="112px"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <span className="text-2xl font-bold tracking-tight text-muted-foreground select-none">
                      {initials}
                    </span>
                  )}

                  {isAvatarLoading && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center z-10">
                      <LoaderCircle className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAvatarLoading}
                  aria-label="Upload administrator avatar"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>

              {/* Identity & Actions Overview */}
              <div className="space-y-3 text-center sm:text-left flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {profile.role}
                    </Badge>
                    <Badge className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active Staff
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAvatarLoading}
                    className="text-xs h-8 rounded-lg cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <LoaderCircle className="h-3 w-3 mr-1.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-3 w-3 mr-1.5" />
                        Update Avatar
                      </>
                    )}
                  </Button>

                  {profile.avatar?.secureUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAvatarMutation.mutate()}
                      disabled={isAvatarLoading}
                      className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                    >
                      {isRemoving ? (
                        <>
                          <LoaderCircle className="h-3 w-3 mr-1.5 animate-spin" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 mr-1.5" />
                          Remove
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Layout: Form & Meta Governance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-6">
              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold">
                    Personal &amp; Contact Information
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update personal credentials and communication telephone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="adminFirstName"
                        className="text-xs font-semibold text-foreground"
                      >
                        First Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="adminFirstName"
                        className="text-xs rounded-xl"
                        {...register("firstName")}
                      />
                      {errors.firstName && (
                        <p className="text-[11px] text-destructive">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="adminLastName"
                        className="text-xs font-semibold text-foreground"
                      >
                        Last Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="adminLastName"
                        className="text-xs rounded-xl"
                        {...register("lastName")}
                      />
                      {errors.lastName && (
                        <p className="text-[11px] text-destructive">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="adminDisplayName"
                      className="text-xs font-semibold text-foreground"
                    >
                      Display Title / Sign-off
                    </label>
                    <Input
                      id="adminDisplayName"
                      placeholder="e.g. Lead Catalog Specialist"
                      className="text-xs rounded-xl"
                      {...register("displayName")}
                    />
                    {errors.displayName && (
                      <p className="text-[11px] text-destructive">{errors.displayName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="adminPhone" className="text-xs font-semibold text-foreground">
                        Phone Contact
                      </label>
                      <Input
                        id="adminPhone"
                        placeholder="+91 9876543210"
                        className="text-xs rounded-xl"
                        {...register("phone")}
                      />
                      {errors.phone && (
                        <p className="text-[11px] text-destructive">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="adminTimezone"
                        className="text-xs font-semibold text-foreground"
                      >
                        Timezone
                      </label>
                      <select
                        id="adminTimezone"
                        className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        {...register("preferences.timezone")}
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                        <option value="America/New_York">America/New_York (EST -5:00)</option>
                        <option value="Europe/London">Europe/London (GMT +0:00)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="adminBio" className="text-xs font-semibold text-foreground">
                      Operator Bio &amp; Role Summary
                    </label>
                    <Textarea
                      id="adminBio"
                      rows={3}
                      placeholder="Brief description of administrative oversight and responsibilities..."
                      className="text-xs rounded-xl resize-none"
                      {...register("bio")}
                    />
                    {errors.bio && (
                      <p className="text-[11px] text-destructive">{errors.bio.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => reset(defaultValues)}
                  disabled={!isDirty || isSaving}
                  className="text-xs h-9 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Discard
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!isDirty || isSaving}
                  className="text-xs h-9 rounded-xl px-5 cursor-pointer shadow-xs"
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Save Staff Details
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Governance Overview & Profile Completion */}
          <div className="space-y-6">
            {/* Completion Card */}
            <Card className="rounded-2xl border-border/80 shadow-xs bg-linear-to-br from-card to-muted/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-bold tracking-tight">
                      Staff Profile Health
                    </CardTitle>
                  </div>
                  <span className="text-xs font-extrabold text-primary tabular-nums">
                    {profile.profileCompletion?.percentage}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${profile.profileCompletion?.percentage}%` }}
                  />
                </div>
                <div className="space-y-2 pt-1">
                  {profile.profileCompletion?.items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between text-xs text-muted-foreground"
                    >
                      <div className="flex items-center gap-2">
                        {item.isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className={item.isCompleted ? "text-foreground font-medium" : ""}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                        +{item.weight}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Read-Only Governance Card */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold tracking-tight">
                    Access &amp; Governance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Role Assignment
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {profile.role}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email Verified
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Verified Operator
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Account Enrolled
                  </span>
                  <span className="font-medium text-foreground">{memberSince}</span>
                </div>

                <p className="text-[10px] text-muted-foreground/80 pt-1 leading-relaxed">
                  Roles, access control matrices, and permissions are managed strictly by
                  Superadministrators under RBAC policies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
