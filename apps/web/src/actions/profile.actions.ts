"use server";

import { revalidatePath } from "next/cache";
import { serverFetch, ServerApiClientError } from "@/lib/api/server-api-client";
import { updateProfileSchema, UpdateProfileInput } from "@veyora/validators";
import type { ActionResult, UserProfileDto } from "@veyora/types";

/**
 * Server Action: Update Customer Profile
 * Validates input shape, verifies caller authentication, forwards mutation to API,
 * and revalidates the account profile page path.
 */
export async function updateProfileAction(
  input: UpdateProfileInput,
  auth?: { token?: string }
): Promise<ActionResult<UserProfileDto>> {
  // 1. Zod input shape validation
  const validationResult = updateProfileSchema.safeParse(input);
  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Validation failed: please check your form inputs.",
      code: "VALIDATION_ERROR",
      fieldErrors: fieldErrors as Record<string, string[]>,
      timestamp: new Date().toISOString(),
    };
  }

  // 2. Authoritative API Mutation via Server Client
  try {
    const data = await serverFetch<UserProfileDto>("/profile", {
      method: "PATCH",
      body: validationResult.data,
      token: auth?.token,
      requireAuth: true,
    });

    // 3. Revalidate path on success
    revalidatePath("/account/profile");

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    if (error instanceof ServerApiClientError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred while updating your profile.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}
