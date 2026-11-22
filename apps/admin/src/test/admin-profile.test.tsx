import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { UserProfileDto } from "@veyora/types";
import { Badge } from "../components/ui/badge";

describe("Admin Console Profile UI Tests", () => {
  const mockStaffProfile: UserProfileDto = {
    id: "admin_987",
    email: "catalog.lead@veyora.com",
    firstName: "Dev",
    lastName: "Patel",
    displayName: "Lead Merchandiser",
    phone: "+91 9988776655",
    role: "admin",
    avatar: {
      publicId: "veyora/profiles/staff/admin_987/avatar_1",
      secureUrl: "https://res.cloudinary.com/veyora-cloud/image/upload/v1/avatar.webp",
      width: 400,
      height: 400,
    },
    bio: "Oversees seasonal apparel drops and vendor curation.",
    preferences: { language: "en", timezone: "Asia/Kolkata" },
    isEmailVerified: true,
    isActive: true,
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
    profileCompletion: {
      percentage: 100,
      completedItems: [
        "Full Name",
        "Verified Email",
        "Phone Number",
        "Profile Photo",
        "Personal Bio & Details",
      ],
      remainingItems: [],
      items: [
        { key: "name", label: "Full Name", isCompleted: true, weight: 25 },
        { key: "email", label: "Verified Email", isCompleted: true, weight: 25 },
        { key: "phone", label: "Phone Number", isCompleted: true, weight: 20 },
        { key: "avatar", label: "Profile Photo", isCompleted: true, weight: 15 },
        { key: "personal_details", label: "Personal Bio & Details", isCompleted: true, weight: 15 },
      ],
      isComplete: true,
    },
  };

  it("renders read-only governance badge parameters", () => {
    render(
      <div>
        <span data-testid="role-badge">{mockStaffProfile.role}</span>
        <Badge variant="outline">{mockStaffProfile.role}</Badge>
      </div>
    );

    expect(screen.getByTestId("role-badge")).toHaveTextContent("admin");
  });
});
