"use client";

import * as React from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { Container } from "@/components/ui/container";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileCompletionCard } from "@/components/profile/profile-completion-card";
import { AccountInfoCard } from "@/components/profile/account-info-card";
import { useProfile } from "@/hooks/use-profile";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, User } from "lucide-react";
import Link from "next/link";

function ProfileContent() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <Skeleton className="h-28 w-28 sm:h-32 sm:w-32 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base text-foreground">Unable to Load Profile</h3>
          <p className="text-xs text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred while fetching your account details."}
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
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Avatar Header */}
      <div className="rounded-3xl border border-border/70 bg-linear-to-r from-card via-card to-muted/20 p-6 sm:p-8 shadow-xs">
        <ProfileAvatar
          avatar={profile.avatar}
          firstName={profile.firstName}
          lastName={profile.lastName}
        />
      </div>

      {/* Main Grid: Form & Meta Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ProfileForm profile={profile} />
        </div>

        <div className="space-y-6">
          <ProfileCompletionCard completion={profile.profileCompletion} />
          <AccountInfoCard profile={profile} />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-10 sm:py-14">
        <Container size="xl" className="space-y-8">
          {/* Breadcrumb / Top Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">My Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <User className="h-6 w-6 text-primary" />
              Patron Profile &amp; Preferences
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your personal information, delivery contact details, and sartorial profile.
            </p>
          </div>

          <ProfileContent />
        </Container>
      </div>
    </ProtectedRoute>
  );
}
