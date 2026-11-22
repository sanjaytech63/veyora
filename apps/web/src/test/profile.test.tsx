import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ProfileCompletionCard } from "../components/profile/profile-completion-card";
import { AccountInfoCard } from "../components/profile/account-info-card";
import { UserProfileDto, ProfileCompletionDto } from "@veyora/types";

describe("Storefront Customer Profile Components", () => {
  const mockCompletion: ProfileCompletionDto = {
    percentage: 75,
    completedItems: ["Full Name", "Verified Email", "Phone Number"],
    remainingItems: ["Profile Photo", "Personal Bio & Details"],
    items: [
      { key: "name", label: "Full Name", isCompleted: true, weight: 25 },
      { key: "email", label: "Verified Email", isCompleted: true, weight: 25 },
      { key: "phone", label: "Phone Number", isCompleted: true, weight: 20 },
      { key: "avatar", label: "Profile Photo", isCompleted: false, weight: 15 },
      { key: "personal_details", label: "Personal Bio & Details", isCompleted: false, weight: 15 },
    ],
    isComplete: false,
  };

  const mockProfile: UserProfileDto = {
    id: "usr_12345",
    email: "patron@veyora.com",
    firstName: "Tara",
    lastName: "Sutaria",
    displayName: "Tara S.",
    phone: "+91 9876543210",
    role: "customer",
    avatar: null,
    bio: "Passionate about sustainable couture.",
    preferences: { language: "en", timezone: "Asia/Kolkata" },
    isEmailVerified: true,
    isActive: true,
    createdAt: "2026-02-15T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
    profileCompletion: mockCompletion,
  };

  it("renders ProfileCompletionCard with percentage and items checklist", () => {
    render(<ProfileCompletionCard completion={mockCompletion} />);

    expect(screen.getByText("Profile Completion")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Full Name")).toBeInTheDocument();
    expect(screen.getByText("Verified Email")).toBeInTheDocument();
    expect(screen.getByText("Phone Number")).toBeInTheDocument();
    expect(screen.getByText("Profile Photo")).toBeInTheDocument();
    expect(screen.getByText("Personal Bio & Details")).toBeInTheDocument();
  });

  it("renders AccountInfoCard with verified status and member since date", () => {
    render(<AccountInfoCard profile={mockProfile} />);

    expect(screen.getByText("Account Overview")).toBeInTheDocument();
    expect(screen.getByText("Active Account")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("customer Patron")).toBeInTheDocument();
  });
});
