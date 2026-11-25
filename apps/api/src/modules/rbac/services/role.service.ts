/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { Role, IRole } from "../models/role.model";
import { User } from "../../auth/models/user.model";
import { CreateRoleInput, RoleDto, UpdateRoleInput, ApiRbacCode } from "@veyora/types";
import { BadRequestError, NotFoundError, ForbiddenError } from "@veyora/utils";
import { auditLogService, LogActor } from "./audit-log.service";
import { hasPermission } from "../permission-registry";

export class RoleService {
  /**
   * Seed baseline administrative roles if they do not exist
   */
  public async seedDefaultRoles(): Promise<void> {
    const count = await Role.countDocuments();
    if (count > 0) return;

    const defaultRoles = [
      {
        name: "superadmin",
        displayName: "Super Administrator",
        description: "Full, unrestricted access to the entire Veyora commerce ecosystem.",
        permissions: ["*"],
        isSystem: true,
      },
      {
        name: "admin",
        displayName: "Administrator",
        description:
          "Comprehensive administration access across products, orders, inventory, and promotions.",
        permissions: [
          "products:read",
          "products:write",
          "products:delete",
          "categories:read",
          "categories:write",
          "categories:delete",
          "inventory:read",
          "inventory:write",
          "orders:read",
          "orders:write",
          "orders:cancel",
          "orders:update_status",
          "customers:read",
          "customers:write",
          "payments:read",
          "payments:refund",
          "coupons:read",
          "coupons:write",
          "coupons:delete",
          "analytics:read",
          "settings:read",
          "staff:read",
          "roles:read",
          "audit:read",
        ],
        isSystem: true,
      },
      {
        name: "catalog_manager",
        displayName: "Catalog & Apparel Manager",
        description: "Manages couture apparel, categories, collections, and catalog listings.",
        permissions: [
          "products:read",
          "products:write",
          "products:delete",
          "categories:read",
          "categories:write",
          "categories:delete",
          "inventory:read",
        ],
        isSystem: false,
      },
      {
        name: "order_manager",
        displayName: "Order & Fulfillment Manager",
        description: "Manages client orders, fulfillment stages, shipments, and customer payments.",
        permissions: [
          "orders:read",
          "orders:write",
          "orders:cancel",
          "orders:update_status",
          "payments:read",
          "payments:refund",
          "customers:read",
        ],
        isSystem: false,
      },
      {
        name: "inventory_specialist",
        displayName: "Inventory Specialist",
        description:
          "Oversees atelier garment stocks, warehouse counts, and inventory replenishments.",
        permissions: ["inventory:read", "inventory:write", "products:read"],
        isSystem: false,
      },
      {
        name: "customer_support",
        displayName: "Customer Relations Agent",
        description: "Handles customer inquiries, patron dossiers, and order assistance.",
        permissions: ["customers:read", "orders:read", "payments:read"],
        isSystem: false,
      },
    ];

    for (const r of defaultRoles) {
      await Role.findOneAndUpdate(
        { name: r.name },
        { $setOnInsert: r },
        { upsert: true, new: true }
      );
    }
  }

  /**
   * List all administrative roles
   */
  public async listRoles(): Promise<RoleDto[]> {
    const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 }).lean();

    // Compute active staff counts assigned to each role
    const staffCounts = await User.aggregate([
      { $match: { role: { $in: ["admin", "superadmin"] }, isActive: true } },
      { $unwind: "$assignedRoles" },
      { $group: { _id: "$assignedRoles", count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const item of staffCounts) {
      countMap.set(item._id.toString(), item.count);
    }

    return (roles as any[]).map((r) => ({
      id: r._id.toString(),
      name: r.name,
      displayName: r.displayName,
      description: r.description || "",
      permissions: r.permissions || [],
      isSystem: Boolean(r.isSystem),
      staffCount: countMap.get(r._id.toString()) || 0,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));
  }

  /**
   * Retrieve role by ID
   */
  public async getRoleById(id: string): Promise<RoleDto> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError(
        "Invalid role ID format",
        undefined,
        ApiRbacCode.RBAC_ROLE_NOT_FOUND
      );
    }

    const role: any = await Role.findById(id).lean();
    if (!role) {
      throw new NotFoundError("Role not found", undefined, ApiRbacCode.RBAC_ROLE_NOT_FOUND);
    }

    const staffCount = await User.countDocuments({
      role: { $in: ["admin", "superadmin"] },
      assignedRoles: role._id,
      isActive: true,
    });

    return {
      id: role._id.toString(),
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
      permissions: role.permissions || [],
      isSystem: Boolean(role.isSystem),
      staffCount,
      createdAt: role.createdAt ? new Date(role.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: role.updatedAt ? new Date(role.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Retrieve role by Name
   */
  public async getRoleByName(name: string): Promise<IRole | null> {
    return Role.findOne({ name: name.toLowerCase().trim() });
  }

  /**
   * Create a custom administrative role
   */
  public async createRole(actor: LogActor, input: CreateRoleInput): Promise<RoleDto> {
    const normalizedName = input.name.toLowerCase().trim();

    // Check uniqueness
    const existing = await Role.findOne({ name: normalizedName });
    if (existing) {
      throw new BadRequestError(
        `Role with identifier '${normalizedName}' already exists`,
        undefined,
        ApiRbacCode.RBAC_ROLE_CONFLICT
      );
    }

    // Least privilege check: actor cannot create a role with permissions they do not possess
    if (actor.role !== "superadmin") {
      const actorUser: any = await User.findById(actor.id).populate("assignedRoles");
      const actorPerms: string[] = actorUser?.permissions || [];
      for (const perm of input.permissions) {
        if (!hasPermission(actorPerms, perm)) {
          throw new ForbiddenError(
            `Privilege escalation prevented. You cannot grant permission '${perm}' which you do not possess.`,
            undefined,
            ApiRbacCode.RBAC_PRIVILEGE_ESCALATION
          );
        }
      }
    }

    const role = await Role.create({
      name: normalizedName,
      displayName: input.displayName.trim(),
      description: input.description?.trim() || "",
      permissions: input.permissions,
      isSystem: false,
    });

    await auditLogService.log(actor, "ROLE_CREATED", "role", role._id.toString(), {
      name: role.name,
      displayName: role.displayName,
      permissions: role.permissions,
    });

    return {
      id: role._id.toString(),
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions,
      isSystem: role.isSystem,
      staffCount: 0,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  /**
   * Update role details and permissions
   */
  public async updateRole(actor: LogActor, id: string, input: UpdateRoleInput): Promise<RoleDto> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError(
        "Invalid role ID format",
        undefined,
        ApiRbacCode.RBAC_ROLE_NOT_FOUND
      );
    }

    const role = await Role.findById(id);
    if (!role) {
      throw new NotFoundError("Role not found", undefined, ApiRbacCode.RBAC_ROLE_NOT_FOUND);
    }

    // System roles protection
    if (role.isSystem && role.name === "superadmin" && input.permissions) {
      if (!input.permissions.includes("*")) {
        throw new ForbiddenError(
          "Cannot revoke root wildcard permission from Superadmin system role",
          undefined,
          ApiRbacCode.RBAC_SYSTEM_ROLE_PROTECTED
        );
      }
    }

    // Least privilege check
    if (actor.role !== "superadmin" && input.permissions) {
      const actorUser: any = await User.findById(actor.id).populate("assignedRoles");
      const actorPerms: string[] = actorUser?.permissions || [];
      for (const perm of input.permissions) {
        if (!hasPermission(actorPerms, perm)) {
          throw new ForbiddenError(
            `Privilege escalation prevented. You cannot grant permission '${perm}' which you do not possess.`,
            undefined,
            ApiRbacCode.RBAC_PRIVILEGE_ESCALATION
          );
        }
      }
    }

    const changes: Record<string, unknown> = {};

    if (input.displayName !== undefined) {
      changes.oldDisplayName = role.displayName;
      changes.newDisplayName = input.displayName;
      role.displayName = input.displayName.trim();
    }

    if (input.description !== undefined) {
      changes.oldDescription = role.description;
      changes.newDescription = input.description;
      role.description = input.description.trim();
    }

    if (input.permissions !== undefined) {
      changes.oldPermissions = role.permissions;
      changes.newPermissions = input.permissions;
      role.permissions = input.permissions;
    }

    await role.save();

    await auditLogService.log(actor, "ROLE_UPDATED", "role", role._id.toString(), {
      name: role.name,
      ...changes,
    });

    const staffCount = await User.countDocuments({
      role: { $in: ["admin", "superadmin"] },
      assignedRoles: role._id,
      isActive: true,
    });

    return {
      id: role._id.toString(),
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions,
      isSystem: role.isSystem,
      staffCount,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  /**
   * Delete custom administrative role
   */
  public async deleteRole(
    actor: LogActor,
    id: string
  ): Promise<{ success: boolean; message: string }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError(
        "Invalid role ID format",
        undefined,
        ApiRbacCode.RBAC_ROLE_NOT_FOUND
      );
    }

    const role = await Role.findById(id);
    if (!role) {
      throw new NotFoundError("Role not found", undefined, ApiRbacCode.RBAC_ROLE_NOT_FOUND);
    }

    if (role.isSystem) {
      throw new ForbiddenError(
        "Cannot delete system roles",
        undefined,
        ApiRbacCode.RBAC_SYSTEM_ROLE_PROTECTED
      );
    }

    // Check if any active staff are assigned to this role
    const assignedCount = await User.countDocuments({
      role: { $in: ["admin", "superadmin"] },
      assignedRoles: role._id,
    });

    if (assignedCount > 0) {
      throw new ForbiddenError(
        `Cannot delete role '${role.displayName}'. It is currently assigned to ${assignedCount} staff user(s). Reassign them first.`,
        undefined,
        ApiRbacCode.RBAC_ROLE_CONFLICT
      );
    }

    await Role.findByIdAndDelete(id);

    await auditLogService.log(actor, "ROLE_DELETED", "role", id, {
      name: role.name,
      displayName: role.displayName,
    });

    return {
      success: true,
      message: `Role '${role.displayName}' deleted successfully`,
    };
  }
}

export const roleService = new RoleService();
