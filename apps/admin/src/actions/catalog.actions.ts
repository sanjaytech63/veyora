"use server";

import { revalidatePath } from "next/cache";
import { serverAdminFetch, ServerApiClientError } from "@/lib/api/server-api-client";
import {
  createProductSchema,
  updateProductSchema,
  CreateProductInput,
  UpdateProductInput,
} from "@veyora/validators";
import type { ActionResult, Product } from "@veyora/types";

/**
 * Server Action: Create Product in Catalog
 * Authenticates admin operator, validates payload shape, submits to API,
 * and revalidates product listing paths.
 */
export async function createProductAction(
  input: CreateProductInput,
  auth?: { token?: string }
): Promise<ActionResult<Product>> {
  const validation = createProductSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Product validation failed: check required fields.",
      code: "VALIDATION_ERROR",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const product = await serverAdminFetch<Product>("/admin/catalog/products", {
      method: "POST",
      body: validation.data,
      token: auth?.token,
      requireAuth: true,
    });

    revalidatePath("/products");
    revalidatePath("/catalog");

    return {
      success: true,
      data: product,
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
      error: "Failed to create product in catalog.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Server Action: Update Existing Product
 */
export async function updateProductAction(
  productId: string,
  input: UpdateProductInput,
  auth?: { token?: string }
): Promise<ActionResult<Product>> {
  if (!productId || typeof productId !== "string") {
    return {
      success: false,
      error: "Product ID is required.",
      code: "INVALID_IDENTIFIER",
      timestamp: new Date().toISOString(),
    };
  }

  const validation = updateProductSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid product modification payload.",
      code: "VALIDATION_ERROR",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const product = await serverAdminFetch<Product>(`/admin/catalog/products/${productId}`, {
      method: "PUT",
      body: validation.data,
      token: auth?.token,
      requireAuth: true,
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      data: product,
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
      error: "Failed to update product.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Server Action: Delete Product
 */
export async function deleteProductAction(
  productId: string,
  auth?: { token?: string }
): Promise<ActionResult<{ productId: string }>> {
  if (!productId) {
    return {
      success: false,
      error: "Product ID is required.",
      code: "INVALID_IDENTIFIER",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    await serverAdminFetch<void>(`/admin/catalog/products/${productId}`, {
      method: "DELETE",
      token: auth?.token,
      requireAuth: true,
    });

    revalidatePath("/products");

    return {
      success: true,
      data: { productId },
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
      error: "Failed to delete product.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}
