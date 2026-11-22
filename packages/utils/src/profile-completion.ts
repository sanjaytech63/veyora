import { ProfileCompletionDto, ProfileCompletionItem } from "@veyora/types";

export interface ProfileCompletionInput {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isEmailVerified?: boolean;
  phone?: string | null;
  avatar?: { secureUrl?: string | null } | null;
  bio?: string | null;
  displayName?: string | null;
  dateOfBirth?: string | Date | null;
  gender?: string | null;
}

/**
 * Reusable profile completion calculation engine.
 * Computes deterministic completion percentage and itemized breakdown.
 */
export function calculateProfileCompletion(
  profile: ProfileCompletionInput | null | undefined
): ProfileCompletionDto {
  if (!profile) {
    return {
      percentage: 0,
      completedItems: [],
      remainingItems: [
        "Full Name",
        "Verified Email",
        "Phone Number",
        "Profile Photo",
        "Personal Bio & Details",
      ],
      items: [
        { key: "name", label: "Full Name", isCompleted: false, weight: 25 },
        { key: "email", label: "Verified Email", isCompleted: false, weight: 25 },
        { key: "phone", label: "Phone Number", isCompleted: false, weight: 20 },
        { key: "avatar", label: "Profile Photo", isCompleted: false, weight: 15 },
        {
          key: "personal_details",
          label: "Personal Bio & Details",
          isCompleted: false,
          weight: 15,
        },
      ],
      isComplete: false,
    };
  }

  const hasName = Boolean(profile.firstName?.trim() && profile.lastName?.trim());
  const hasEmail = Boolean(profile.email?.trim() && profile.isEmailVerified);
  const hasPhone = Boolean(profile.phone?.trim() && profile.phone.trim().length >= 7);
  const hasAvatar = Boolean(
    profile.avatar?.secureUrl && profile.avatar.secureUrl.trim().length > 0
  );
  const hasDetails = Boolean(
    profile.bio?.trim() || profile.displayName?.trim() || profile.gender || profile.dateOfBirth
  );

  const items: ProfileCompletionItem[] = [
    { key: "name", label: "Full Name", isCompleted: hasName, weight: 25 },
    { key: "email", label: "Verified Email", isCompleted: hasEmail, weight: 25 },
    { key: "phone", label: "Phone Number", isCompleted: hasPhone, weight: 20 },
    { key: "avatar", label: "Profile Photo", isCompleted: hasAvatar, weight: 15 },
    {
      key: "personal_details",
      label: "Personal Bio & Details",
      isCompleted: hasDetails,
      weight: 15,
    },
  ];

  let percentage = 0;
  const completedItems: string[] = [];
  const remainingItems: string[] = [];

  for (const item of items) {
    if (item.isCompleted) {
      percentage += item.weight;
      completedItems.push(item.label);
    } else {
      remainingItems.push(item.label);
    }
  }

  // Ensure strict bounds between 0 and 100
  percentage = Math.min(100, Math.max(0, percentage));

  return {
    percentage,
    completedItems,
    remainingItems,
    items,
    isComplete: percentage === 100,
  };
}
