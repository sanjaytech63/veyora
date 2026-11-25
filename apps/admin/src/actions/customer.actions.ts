"use server";

import { revalidatePath } from "next/cache";
import { serverAdminFetch, ServerApiClientError } from "@/lib/api/server-api-client";
import {
  updateCustomerStatusSchema,
  updateCustomerNotesSchema,
  UpdateCustomerStatusInput,
  UpdateCustomerNotesInput,
} from "@veyora/validators";
import type { ActionResult, CustomerDto } from "@veyora/types";

/**
 * Server Action: Update Customer Status (Admin Governance)
 */
export async function updateCustomerStatusAction(
  customerId: string,
  input: UpdateCustomerStatusInput,
  auth?: { token?: string }
): Promise<ActionResult<CustomerDto>> {
  if (!customerId) {
    return {
      success: false,
      error: "Customer identifier is required.",
      code: "INVALID_IDENTIFIER",
      timestamp: new Date().toISOString(),
    };
  }

  const validation = updateCustomerStatusSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid status update payload.",
      code: "VALIDATION_ERROR",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const customer = await serverAdminFetch<CustomerDto>(`/admin/customers/${customerId}/status`, {
      method: "PATCH",
      body: validation.data,
      token: auth?.token,
      requireAuth: true,
    });

    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);

    return {
      success: true,
      data: customer,
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
      error: "Failed to update customer status.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Server Action: Update Internal Customer Notes
 */
export async function updateCustomerNotesAction(
  customerId: string,
  input: UpdateCustomerNotesInput,
  auth?: { token?: string }
): Promise<ActionResult<CustomerDto>> {
  if (!customerId) {
    return {
      success: false,
      error: "Customer identifier is required.",
      code: "INVALID_IDENTIFIER",
      timestamp: new Date().toISOString(),
    };
  }

  const validation = updateCustomerNotesSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid customer notes format.",
      code: "VALIDATION_ERROR",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const customer = await serverAdminFetch<CustomerDto>(`/admin/customers/${customerId}/notes`, {
      method: "PATCH",
      body: validation.data,
      token: auth?.token,
      requireAuth: true,
    });

    revalidatePath(`/customers/${customerId}`);

    return {
      success: true,
      data: customer,
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
      error: "Failed to update customer notes.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}
