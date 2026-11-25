"use server";

import { revalidatePath } from "next/cache";
import { serverFetch, ServerApiClientError } from "@/lib/api/server-api-client";
import {
  createAddressSchema,
  updateAddressSchema,
  addressParamSchema,
  CreateAddressInput,
  UpdateAddressInput,
} from "@veyora/validators";
import type { ActionResult, AddressDto } from "@veyora/types";

/**
 * Server Action: Create New Customer Address
 */
export async function createAddressAction(
  input: CreateAddressInput,
  auth?: { token?: string }
): Promise<ActionResult<AddressDto>> {
  const validation = createAddressSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid address details provided.",
      code: "VALIDATION_ERROR",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const address = await serverFetch<AddressDto>("/addresses", {
      method: "POST",
      body: validation.data,
      token: auth?.token,
      requireAuth: true,
    });

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return {
      success: true,
      data: address,
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
      error: "Failed to create address. Please try again.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Server Action: Update Existing Customer Address
 */
export async function updateAddressAction(
  addressId: string,
  input: UpdateAddressInput,
  auth?: { token?: string }
): Promise<ActionResult<AddressDto>> {
  const paramValidation = addressParamSchema.safeParse({ addressId });
  if (!paramValidation.success) {
    return {
      success: false,
      error: "Invalid address identifier.",
      code: "INVALID_IDENTIFIER",
      timestamp: new Date().toISOString(),
    };
  }

  const bodyValidation = updateAddressSchema.safeParse(input);
  if (!bodyValidation.success) {
    return {
      success: false,
      error: "Invalid address modification inputs.",
      code: "VALIDATION_ERROR",
      fieldErrors: bodyValidation.error.flatten().fieldErrors as Record<string, string[]>,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const updated = await serverFetch<AddressDto>(`/addresses/${addressId}`, {
      method: "PUT",
      body: bodyValidation.data,
      token: auth?.token,
      requireAuth: true,
    });

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return {
      success: true,
      data: updated,
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
      error: "Failed to update address.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Server Action: Delete Customer Address
 */
export async function deleteAddressAction(
  addressId: string,
  auth?: { token?: string }
): Promise<ActionResult<{ addressId: string }>> {
  const paramValidation = addressParamSchema.safeParse({ addressId });
  if (!paramValidation.success) {
    return {
      success: false,
      error: "Invalid address identifier.",
      code: "INVALID_IDENTIFIER",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    await serverFetch<void>(`/addresses/${addressId}`, {
      method: "DELETE",
      token: auth?.token,
      requireAuth: true,
    });

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return {
      success: true,
      data: { addressId },
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
      error: "Failed to delete address.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Server Action: Set Default Customer Address
 */
export async function setDefaultAddressAction(
  addressId: string,
  auth?: { token?: string }
): Promise<ActionResult<{ addressId: string }>> {
  const paramValidation = addressParamSchema.safeParse({ addressId });
  if (!paramValidation.success) {
    return {
      success: false,
      error: "Invalid address identifier.",
      code: "INVALID_IDENTIFIER",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    await serverFetch<void>(`/addresses/${addressId}/default`, {
      method: "PATCH",
      token: auth?.token,
      requireAuth: true,
    });

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return {
      success: true,
      data: { addressId },
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
      error: "Failed to update default address.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}
