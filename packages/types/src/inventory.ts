/**
 * Inventory & Stock Tracking Types for Veyora
 */

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export type StockMovementType =
  | "restock"
  | "adjustment"
  | "correction"
  | "reservation"
  | "reservation_release"
  | "reservation_commit"
  | "damaged"
  | "return";

export interface StockMovement {
  id: string;
  inventoryId: string;
  productId: string;
  variantId?: string;
  sku: string;
  type: StockMovementType;
  quantity: number;
  previousOnHand: number;
  newOnHand: number;
  previousReserved: number;
  newReserved: number;
  reason: string;
  referenceId?: string;
  note?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productTitle: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  status: InventoryStatus;
  trackQuantity: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalTrackedItems: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalUnitsOnHand: number;
  totalUnitsReserved: number;
}
