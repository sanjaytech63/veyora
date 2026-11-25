"use server";

import { revalidatePath } from "next/cache";
import { serverAdminFetch, ServerApiClientError } from "@/lib/api/server-api-client";
import { updateOrderStatusSchema, UpdateOrderStatusInput } from "@veyora/validators";
import type { ActionResult, OrderDto } from "@veyora/types";

/**
 * Server Action: Update Order Status (Admin Governance)
 */
export async function updateOrderStatusAction(
  orderId: string,
  input: UpdateOrderStatusInput,
  auth?: { token?: string }
): Promise<ActionResult<OrderDto>> {
  if (!orderId) {
    return {
      success: false,
      error: "Order identifier is required.",
      code: "INVALID_IDENTIFIER",
      timestamp: new Date().toISOString(),
    };
  }

  const validation = updateOrderStatusSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid order status transition payload.",
      code: "VALIDATION_ERROR",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const order = await serverAdminFetch<OrderDto>(`/admin/orders/${orderId}/status`, {
      method: "PATCH",
      body: validation.data,
      token: auth?.token,
      requireAuth: true,
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);

    return {
      success: true,
      data: order,
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
      error: "Failed to update order status.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}
