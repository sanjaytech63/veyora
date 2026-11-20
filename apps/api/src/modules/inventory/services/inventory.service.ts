import mongoose from "mongoose";
import { Inventory, IInventory } from "../models/inventory.model";
import { StockMovement, IStockMovement } from "../models/stock-movement.model";
import { Product } from "../../catalog/models/product.model";
import {
  AdjustStockInput,
  ReserveStockInput,
  ReleaseReservationInput,
  CommitReservationInput,
  InventoryQueryInput,
} from "@veyora/validators";
import {
  InventoryItem,
  StockMovement as StockMovementDto,
  InventoryStats,
  StockMovementType,
} from "@veyora/types";
import { ConflictError, NotFoundError } from "@veyora/utils";

export interface PaginatedInventory {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedMovements {
  items: StockMovementDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class InventoryService {
  private toInventoryDto(doc: IInventory): InventoryItem {
    const onHand = doc.onHand || 0;
    const reserved = doc.reserved || 0;
    return {
      id: doc._id.toString(),
      productId: doc.productId.toString(),
      productTitle: doc.productTitle,
      variantId: doc.variantId ? doc.variantId.toString() : undefined,
      variantName: doc.variantName,
      sku: doc.sku,
      onHand,
      reserved,
      available: Math.max(0, onHand - reserved),
      lowStockThreshold: doc.lowStockThreshold,
      status: doc.status,
      trackQuantity: doc.trackQuantity,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private toMovementDto(doc: IStockMovement): StockMovementDto {
    return {
      id: doc._id.toString(),
      inventoryId: doc.inventoryId.toString(),
      productId: doc.productId.toString(),
      variantId: doc.variantId ? doc.variantId.toString() : undefined,
      sku: doc.sku,
      type: doc.type,
      quantity: doc.quantity,
      previousOnHand: doc.previousOnHand,
      newOnHand: doc.newOnHand,
      previousReserved: doc.previousReserved,
      newReserved: doc.newReserved,
      reason: doc.reason,
      referenceId: doc.referenceId,
      note: doc.note,
      userId: doc.userId ? doc.userId.toString() : undefined,
      userName: doc.userName,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  private async syncProductStock(doc: IInventory): Promise<void> {
    const product = await Product.findById(doc.productId);
    if (!product) return;

    if (doc.variantId) {
      const variant = product.variants?.find(
        (v) => v.sku.toUpperCase() === doc.sku.toUpperCase()
      );
      if (variant) {
        variant.stock = doc.onHand;
      }
      // Recompute total product stock as sum of variants if variants exist
      const totalVariantStock = (product.variants || []).reduce(
        (acc, v) => acc + (v.stock || 0),
        0
      );
      product.stock = totalVariantStock;
    } else {
      product.stock = doc.onHand;
    }

    await product.save();
  }

  async getInventoryBySkuOrId(skuOrId: string): Promise<InventoryItem> {
    const isObjectId = mongoose.Types.ObjectId.isValid(skuOrId);
    const query = isObjectId
      ? { $or: [{ _id: skuOrId }, { sku: skuOrId.toUpperCase() }] }
      : { sku: skuOrId.toUpperCase() };

    const item = await Inventory.findOne(query);
    if (!item) {
      throw new NotFoundError(`Inventory item "${skuOrId}" not found.`);
    }

    return this.toInventoryDto(item);
  }

  async getInventoryItems(query: InventoryQueryInput): Promise<PaginatedInventory> {
    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== "all") {
      filter["status"] = query.status;
    }

    if (query.lowStockOnly) {
      filter["status"] = { $in: ["low_stock", "out_of_stock"] };
    }

    if (query.search) {
      filter["$or"] = [
        { sku: { $regex: query.search, $options: "i" } },
        { productTitle: { $regex: query.search, $options: "i" } },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const sortField = query.sortBy || "updatedAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [items, total] = await Promise.all([
      Inventory.find(filter).sort(sortOptions).skip(skip).limit(limit),
      Inventory.countDocuments(filter),
    ]);

    return {
      items: items.map((i) => this.toInventoryDto(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async adjustStock(
    input: AdjustStockInput,
    user?: { id?: string; email?: string }
  ): Promise<InventoryItem> {
    const sku = input.sku.toUpperCase().trim();
    let inventory = await Inventory.findOne({ sku });

    // Auto-create inventory record if product with this SKU exists
    if (!inventory) {
      const product = await Product.findOne({
        $or: [{ sku }, { "variants.sku": sku }],
      });
      if (!product) {
        throw new NotFoundError(`No catalog product found with SKU "${sku}".`);
      }

      const variant = product.variants?.find((v) => v.sku.toUpperCase() === sku);
      inventory = await Inventory.create({
        productId: product._id,
        productTitle: product.title,
        variantId: variant ? (variant as unknown as { _id?: mongoose.Types.ObjectId })._id ?? null : null,
        variantName: variant ? [variant.color, variant.size].filter(Boolean).join(" / ") : undefined,
        sku,
        onHand: 0,
        reserved: 0,
        lowStockThreshold: 5,
        trackQuantity: product.trackQuantity,
      });
    }

    const prevOnHand = inventory.onHand;
    const prevReserved = inventory.reserved;
    let newOnHand = prevOnHand;
    let delta = 0;
    let movementType: StockMovementType = "adjustment";

    if (input.type === "increase") {
      delta = input.quantity;
      newOnHand = prevOnHand + delta;
      movementType = "restock";
    } else if (input.type === "decrease") {
      const available = Math.max(0, prevOnHand - prevReserved);
      if (input.quantity > available) {
        throw new ConflictError(
          `Cannot decrease stock by ${input.quantity}. Only ${available} units are currently available (Reserved: ${prevReserved}).`
        );
      }
      delta = -input.quantity;
      newOnHand = Math.max(0, prevOnHand - input.quantity);
      movementType = "adjustment";
    } else if (input.type === "correction") {
      if (input.quantity < prevReserved) {
        throw new ConflictError(
          `Physical count correction (${input.quantity}) cannot be lower than currently reserved units (${prevReserved}).`
        );
      }
      delta = input.quantity - prevOnHand;
      newOnHand = input.quantity;
      movementType = "correction";
    }

    inventory.onHand = newOnHand;
    await inventory.save();

    // Record Stock Movement audit entry
    await StockMovement.create({
      inventoryId: inventory._id,
      productId: inventory.productId,
      variantId: inventory.variantId,
      sku: inventory.sku,
      type: movementType,
      quantity: delta,
      previousOnHand: prevOnHand,
      newOnHand,
      previousReserved: prevReserved,
      newReserved: prevReserved,
      reason: input.reason,
      referenceId: input.referenceId,
      note: input.note,
      userId: user?.id ? new mongoose.Types.ObjectId(user.id) : null,
      userName: user?.email,
    });

    // Synchronize catalog product stock level
    await this.syncProductStock(inventory);

    return this.toInventoryDto(inventory);
  }

  async reserveStock(input: ReserveStockInput): Promise<InventoryItem> {
    const sku = input.sku.toUpperCase().trim();
    const inventory = await Inventory.findOne({ sku });
    if (!inventory) {
      throw new NotFoundError(`Inventory item for SKU "${sku}" not found.`);
    }

    const available = Math.max(0, inventory.onHand - inventory.reserved);
    if (available < input.quantity) {
      throw new ConflictError(
        `Insufficient available stock for SKU "${sku}". Available: ${available}, Requested: ${input.quantity}`
      );
    }

    const prevOnHand = inventory.onHand;
    const prevReserved = inventory.reserved;
    const newReserved = prevReserved + input.quantity;

    inventory.reserved = newReserved;
    await inventory.save();

    await StockMovement.create({
      inventoryId: inventory._id,
      productId: inventory.productId,
      variantId: inventory.variantId,
      sku: inventory.sku,
      type: "reservation",
      quantity: input.quantity,
      previousOnHand: prevOnHand,
      newOnHand: prevOnHand,
      previousReserved: prevReserved,
      newReserved,
      reason: `Stock reserved for reference: ${input.referenceId}`,
      referenceId: input.referenceId,
    });

    return this.toInventoryDto(inventory);
  }

  async releaseReservation(input: ReleaseReservationInput): Promise<InventoryItem> {
    const sku = input.sku.toUpperCase().trim();
    const inventory = await Inventory.findOne({ sku });
    if (!inventory) {
      throw new NotFoundError(`Inventory item for SKU "${sku}" not found.`);
    }

    const prevOnHand = inventory.onHand;
    const prevReserved = inventory.reserved;
    const releaseQty = Math.min(prevReserved, input.quantity);
    const newReserved = Math.max(0, prevReserved - releaseQty);

    inventory.reserved = newReserved;
    await inventory.save();

    await StockMovement.create({
      inventoryId: inventory._id,
      productId: inventory.productId,
      variantId: inventory.variantId,
      sku: inventory.sku,
      type: "reservation_release",
      quantity: -releaseQty,
      previousOnHand: prevOnHand,
      newOnHand: prevOnHand,
      previousReserved: prevReserved,
      newReserved,
      reason: `Stock reservation released for reference: ${input.referenceId}`,
      referenceId: input.referenceId,
    });

    return this.toInventoryDto(inventory);
  }

  async commitReservation(input: CommitReservationInput): Promise<InventoryItem> {
    const sku = input.sku.toUpperCase().trim();
    const inventory = await Inventory.findOne({ sku });
    if (!inventory) {
      throw new NotFoundError(`Inventory item for SKU "${sku}" not found.`);
    }

    const prevOnHand = inventory.onHand;
    const prevReserved = inventory.reserved;
    const commitQty = Math.min(prevReserved, input.quantity);
    const newReserved = Math.max(0, prevReserved - commitQty);
    const newOnHand = Math.max(0, prevOnHand - commitQty);

    inventory.onHand = newOnHand;
    inventory.reserved = newReserved;
    await inventory.save();

    await StockMovement.create({
      inventoryId: inventory._id,
      productId: inventory.productId,
      variantId: inventory.variantId,
      sku: inventory.sku,
      type: "reservation_commit",
      quantity: -commitQty,
      previousOnHand: prevOnHand,
      newOnHand,
      previousReserved: prevReserved,
      newReserved,
      reason: `Stock reservation committed for reference: ${input.referenceId}`,
      referenceId: input.referenceId,
    });

    await this.syncProductStock(inventory);

    return this.toInventoryDto(inventory);
  }

  async updateThreshold(skuOrId: string, lowStockThreshold: number): Promise<InventoryItem> {
    const isObjectId = mongoose.Types.ObjectId.isValid(skuOrId);
    const query = isObjectId
      ? { $or: [{ _id: skuOrId }, { sku: skuOrId.toUpperCase() }] }
      : { sku: skuOrId.toUpperCase() };

    const item = await Inventory.findOne(query);
    if (!item) {
      throw new NotFoundError(`Inventory item "${skuOrId}" not found.`);
    }

    item.lowStockThreshold = lowStockThreshold;
    await item.save();

    return this.toInventoryDto(item);
  }

  async getMovements(
    skuOrId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedMovements> {
    const isObjectId = mongoose.Types.ObjectId.isValid(skuOrId);
    const filter = isObjectId
      ? { $or: [{ inventoryId: skuOrId }, { sku: skuOrId.toUpperCase() }] }
      : { sku: skuOrId.toUpperCase() };

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [movements, total] = await Promise.all([
      StockMovement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      StockMovement.countDocuments(filter),
    ]);

    return {
      items: movements.map((m) => this.toMovementDto(m)),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

  async getInventoryStats(): Promise<InventoryStats> {
    const [
      totalTrackedItems,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      aggregation,
    ] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({ status: "in_stock" }),
      Inventory.countDocuments({ status: "low_stock" }),
      Inventory.countDocuments({ status: "out_of_stock" }),
      Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalUnitsOnHand: { $sum: "$onHand" },
            totalUnitsReserved: { $sum: "$reserved" },
          },
        },
      ]),
    ]);

    const totals = aggregation[0] || { totalUnitsOnHand: 0, totalUnitsReserved: 0 };

    return {
      totalTrackedItems,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalUnitsOnHand: totals.totalUnitsOnHand || 0,
      totalUnitsReserved: totals.totalUnitsReserved || 0,
    };
  }
}

export const inventoryService = new InventoryService();
