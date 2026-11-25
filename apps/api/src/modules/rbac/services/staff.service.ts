/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { User, IUser } from "../../auth/models/user.model";
import { Role, IRole } from "../models/role.model";
import { passwordService } from "../../auth/services/password.service";
import {
  CreateStaffUserInput,
  StaffListQuery,
  StaffUserDto,
  UpdateStaffUserInput,
  RoleDto,
  ApiRbacCode,
} from "@veyora/types";
import { BadRequestError, NotFoundError, ForbiddenError } from "@veyora/utils";
import { auditLogService, LogActor } from "./audit-log.service";
import { hasPermission } from "../permission-registry";

export class StaffService {
  /**
   * Helper to compute unified effective permissions across assigned roles and custom direct overrides
   */
  public computeEffectivePermissions(user: IUser, assignedRoles: IRole[]): string[] {
    if (user.role === "superadmin") {
      return ["*"];
    }

    const permissionSet = new Set<string>();

    // Permissions inherited from assigned roles
    for (const role of assignedRoles) {
      if (role && Array.isArray(role.permissions)) {
        for (const p of role.permissions) {
          permissionSet.add(p);
        }
      }
    }

    // Direct custom permissions
    if (Array.isArray(user.customPermissions)) {
      for (const p of user.customPermissions) {
        permissionSet.add(p);
      }
    }

    // Also include any legacy permissions
    if (Array.isArray(user.permissions)) {
      for (const p of user.permissions) {
        permissionSet.add(p);
      }
    }

    return Array.from(permissionSet);
  }

  /**
   * Format user entity to StaffUserDto
   */
  private formatStaffDto(user: any, populatedRoles?: any[]): StaffUserDto {
    const roles: IRole[] = populatedRoles || user.assignedRoles || [];
    const effective = this.computeEffectivePermissions(user, roles);

    const roleDtos: RoleDto[] = roles.map((r: any) => ({
      id: r._id ? r._id.toString() : String(r),
      name: r.name || "",
      displayName: r.displayName || r.name || "",
      description: r.description || "",
      permissions: r.permissions || [],
      isSystem: Boolean(r.isSystem),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || null,
      role: user.role,
      assignedRoleIds: roles.map((r: any) => (r._id ? r._id.toString() : String(r))),
      assignedRoles: roleDtos,
      customPermissions: user.customPermissions || [],
      effectivePermissions: effective,
      isActive: Boolean(user.isActive),
      statusReason: user.statusReason || null,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * List staff users with search, role filters, and pagination
   */
  public async listStaff(query: StaffListQuery = {}): Promise<{
    staff: StaffUserDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(Number(query.limit), 100) : 20;
    const skip = (page - 1) * limit;

    const filter: any = {
      role: { $in: ["admin", "superadmin"] },
    };

    if (query.role) {
      filter.role = query.role;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.search) {
      const term = query.search.trim();
      const regex = new RegExp(term, "i");
      filter.$or = [{ email: regex }, { firstName: regex }, { lastName: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).populate("assignedRoles").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const staffDtos = (users as any[]).map((u) => this.formatStaffDto(u, u.assignedRoles));

    return {
      staff: staffDtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieve staff user by ID
   */
  public async getStaffById(id: string): Promise<StaffUserDto> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError(
        "Invalid staff ID format",
        undefined,
        ApiRbacCode.RBAC_STAFF_NOT_FOUND
      );
    }

    const user: any = await User.findOne({
      _id: id,
      role: { $in: ["admin", "superadmin"] },
    }).populate("assignedRoles");

    if (!user) {
      throw new NotFoundError(
        "Staff member not found",
        undefined,
        ApiRbacCode.RBAC_STAFF_NOT_FOUND
      );
    }

    return this.formatStaffDto(user, user.assignedRoles);
  }

  /**
   * Create or invite a new staff user
   */
  public async createStaff(actor: LogActor, input: CreateStaffUserInput): Promise<StaffUserDto> {
    const email = input.email.toLowerCase().trim();

    const existing = await User.findOne({ email });
    if (existing) {
      throw new BadRequestError(
        `User with email '${email}' already exists`,
        undefined,
        ApiRbacCode.RBAC_STAFF_CONFLICT
      );
    }

    const requestedRole = input.role || "admin";

    // Security check: only superadmin can create another superadmin
    if (requestedRole === "superadmin" && actor.role !== "superadmin") {
      throw new ForbiddenError(
        "Only Superadmin can assign or create Superadmin staff members",
        undefined,
        ApiRbacCode.RBAC_PRIVILEGE_ESCALATION
      );
    }

    // Resolve assigned roles
    let validRoleIds: mongoose.Types.ObjectId[] = [];
    let populatedRoles: any[] = [];
    if (input.assignedRoleIds && input.assignedRoleIds.length > 0) {
      for (const rId of input.assignedRoleIds) {
        if (!mongoose.Types.ObjectId.isValid(rId)) {
          throw new BadRequestError(
            `Invalid role ID format: ${rId}`,
            undefined,
            ApiRbacCode.RBAC_ROLE_NOT_FOUND
          );
        }
      }
      validRoleIds = input.assignedRoleIds.map((id) => new mongoose.Types.ObjectId(id));
      populatedRoles = await Role.find({ _id: { $in: validRoleIds } });

      if (populatedRoles.length !== validRoleIds.length) {
        throw new BadRequestError(
          "One or more assigned role IDs could not be resolved",
          undefined,
          ApiRbacCode.RBAC_ROLE_NOT_FOUND
        );
      }
    }

    // Least privilege check: actor must possess all permissions granted to new staff
    if (actor.role !== "superadmin") {
      const actorUser: any = await User.findById(actor.id).populate("assignedRoles");
      const actorPerms: string[] = actorUser?.permissions || [];

      // Check role permissions
      for (const role of populatedRoles) {
        for (const perm of role.permissions || []) {
          if (!hasPermission(actorPerms, perm)) {
            throw new ForbiddenError(
              `Privilege escalation prevented. Role '${role.displayName}' contains permission '${perm}' which you do not possess.`,
              undefined,
              ApiRbacCode.RBAC_PRIVILEGE_ESCALATION
            );
          }
        }
      }

      // Check custom direct permissions
      for (const perm of input.customPermissions || []) {
        if (!hasPermission(actorPerms, perm)) {
          throw new ForbiddenError(
            `Privilege escalation prevented. You cannot grant permission '${perm}' which you do not possess.`,
            undefined,
            ApiRbacCode.RBAC_PRIVILEGE_ESCALATION
          );
        }
      }
    }

    const passwordHash = await passwordService.hashPassword(input.password || "TemporaryPass123!");

    // Compute effective permissions for storage in user.permissions
    const tempUserObj: any = {
      role: requestedRole,
      customPermissions: input.customPermissions || [],
      permissions: [],
    };
    const effectivePermissions = this.computeEffectivePermissions(tempUserObj, populatedRoles);

    const user = await User.create({
      email,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim() || null,
      role: requestedRole,
      assignedRoles: validRoleIds,
      customPermissions: input.customPermissions || [],
      permissions: effectivePermissions,
      isEmailVerified: true,
      isActive: true,
    });

    await auditLogService.log(actor, "STAFF_CREATED", "staff", user._id.toString(), {
      email: user.email,
      role: user.role,
      assignedRoles: populatedRoles.map((r) => r.name),
      customPermissions: user.customPermissions,
    });

    return this.formatStaffDto(user, populatedRoles);
  }

  /**
   * Update staff member details, assigned roles, and permissions
   */
  public async updateStaff(
    actor: LogActor,
    id: string,
    input: UpdateStaffUserInput
  ): Promise<StaffUserDto> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError(
        "Invalid staff ID format",
        undefined,
        ApiRbacCode.RBAC_STAFF_NOT_FOUND
      );
    }

    const user = await User.findOne({
      _id: id,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!user) {
      throw new NotFoundError(
        "Staff member not found",
        undefined,
        ApiRbacCode.RBAC_STAFF_NOT_FOUND
      );
    }

    const changes: Record<string, unknown> = {};

    // Superadmin protection & self-demotion prevention
    if (input.role !== undefined && input.role !== user.role) {
      if (actor.role !== "superadmin") {
        throw new ForbiddenError(
          "Only Superadmin can alter administrative tiers",
          undefined,
          ApiRbacCode.RBAC_PRIVILEGE_ESCALATION
        );
      }

      // Self-demotion prevention
      if (user._id.toString() === actor.id && input.role !== "superadmin") {
        const superadminCount = await User.countDocuments({
          role: "superadmin",
          isActive: true,
        });
        if (superadminCount <= 1) {
          throw new ForbiddenError(
            "Cannot demote the only remaining active Superadmin account",
            undefined,
            ApiRbacCode.RBAC_SELF_ACTION_FORBIDDEN
          );
        }
      }

      changes.oldRole = user.role;
      changes.newRole = input.role;
      user.role = input.role;
    }

    if (input.firstName !== undefined) {
      user.firstName = input.firstName.trim();
    }
    if (input.lastName !== undefined) {
      user.lastName = input.lastName.trim();
    }
    if (input.phone !== undefined) {
      user.phone = input.phone?.trim() || null;
    }

    // Resolve assigned roles if provided
    let populatedRoles: any[] = [];
    if (input.assignedRoleIds !== undefined) {
      for (const rId of input.assignedRoleIds) {
        if (!mongoose.Types.ObjectId.isValid(rId)) {
          throw new BadRequestError(
            `Invalid role ID format: ${rId}`,
            undefined,
            ApiRbacCode.RBAC_ROLE_NOT_FOUND
          );
        }
      }
      const roleObjIds = input.assignedRoleIds.map((rId) => new mongoose.Types.ObjectId(rId));
      populatedRoles = await Role.find({ _id: { $in: roleObjIds } });

      if (populatedRoles.length !== roleObjIds.length) {
        throw new BadRequestError(
          "One or more assigned role IDs could not be resolved",
          undefined,
          ApiRbacCode.RBAC_ROLE_NOT_FOUND
        );
      }

      // Least privilege check
      if (actor.role !== "superadmin") {
        const actorUser: any = await User.findById(actor.id).populate("assignedRoles");
        const actorPerms: string[] = actorUser?.permissions || [];
        for (const role of populatedRoles) {
          for (const perm of role.permissions || []) {
            if (!hasPermission(actorPerms, perm)) {
              throw new ForbiddenError(
                `Privilege escalation prevented. Role '${role.displayName}' contains permission '${perm}' which you do not possess.`,
                undefined,
                ApiRbacCode.RBAC_PRIVILEGE_ESCALATION
              );
            }
          }
        }
      }

      changes.assignedRoles = populatedRoles.map((r) => r.name);
      user.assignedRoles = roleObjIds;
    } else {
      populatedRoles = await Role.find({ _id: { $in: user.assignedRoles || [] } });
    }

    // Custom permissions if provided
    if (input.customPermissions !== undefined) {
      if (actor.role !== "superadmin") {
        const actorUser: any = await User.findById(actor.id).populate("assignedRoles");
        const actorPerms: string[] = actorUser?.permissions || [];
        for (const perm of input.customPermissions) {
          if (!hasPermission(actorPerms, perm)) {
            throw new ForbiddenError(
              `Privilege escalation prevented. You cannot grant permission '${perm}' which you do not possess.`,
              undefined,
              ApiRbacCode.RBAC_PRIVILEGE_ESCALATION
            );
          }
        }
      }
      changes.customPermissions = input.customPermissions;
      user.customPermissions = input.customPermissions;
    }

    if (input.isActive !== undefined) {
      if (!input.isActive && user._id.toString() === actor.id) {
        throw new ForbiddenError(
          "Cannot deactivate your own staff account",
          undefined,
          ApiRbacCode.RBAC_SELF_ACTION_FORBIDDEN
        );
      }
      user.isActive = input.isActive;
      changes.isActive = input.isActive;
    }

    // Recompute effective permissions
    user.permissions = this.computeEffectivePermissions(user, populatedRoles);

    await user.save();

    await auditLogService.log(actor, "STAFF_UPDATED", "staff", user._id.toString(), {
      email: user.email,
      ...changes,
    });

    return this.formatStaffDto(user, populatedRoles);
  }

  /**
   * Toggle staff active status
   */
  public async updateStaffStatus(
    actor: LogActor,
    id: string,
    isActive: boolean,
    statusReason?: string | null
  ): Promise<StaffUserDto> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError(
        "Invalid staff ID format",
        undefined,
        ApiRbacCode.RBAC_STAFF_NOT_FOUND
      );
    }

    if (!isActive && id === actor.id) {
      throw new ForbiddenError(
        "Cannot deactivate your own administrative account",
        undefined,
        ApiRbacCode.RBAC_SELF_ACTION_FORBIDDEN
      );
    }

    const user = await User.findOne({
      _id: id,
      role: { $in: ["admin", "superadmin"] },
    }).populate("assignedRoles");

    if (!user) {
      throw new NotFoundError(
        "Staff member not found",
        undefined,
        ApiRbacCode.RBAC_STAFF_NOT_FOUND
      );
    }

    if (!isActive && user.role === "superadmin") {
      const activeSuperadmins = await User.countDocuments({
        role: "superadmin",
        isActive: true,
      });
      if (activeSuperadmins <= 1) {
        throw new ForbiddenError(
          "Cannot deactivate the only remaining active Superadmin account",
          undefined,
          ApiRbacCode.RBAC_SELF_ACTION_FORBIDDEN
        );
      }
    }

    user.isActive = isActive;
    user.statusReason = statusReason || null;
    await user.save();

    await auditLogService.log(
      actor,
      isActive ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED",
      "staff",
      id,
      {
        email: user.email,
        statusReason,
      }
    );

    return this.formatStaffDto(user, user.assignedRoles);
  }

  /**
   * Delete or remove a staff user
   */
  public async deleteStaff(
    actor: LogActor,
    id: string
  ): Promise<{ success: boolean; message: string }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError(
        "Invalid staff ID format",
        undefined,
        ApiRbacCode.RBAC_STAFF_NOT_FOUND
      );
    }

    if (id === actor.id) {
      throw new ForbiddenError(
        "Cannot delete your own administrative account",
        undefined,
        ApiRbacCode.RBAC_SELF_ACTION_FORBIDDEN
      );
    }

    const user = await User.findOne({
      _id: id,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!user) {
      throw new NotFoundError(
        "Staff member not found",
        undefined,
        ApiRbacCode.RBAC_STAFF_NOT_FOUND
      );
    }

    if (user.role === "superadmin") {
      const superadminCount = await User.countDocuments({ role: "superadmin" });
      if (superadminCount <= 1) {
        throw new ForbiddenError(
          "Cannot delete the only remaining Superadmin account",
          undefined,
          ApiRbacCode.RBAC_SELF_ACTION_FORBIDDEN
        );
      }
    }

    await User.findByIdAndDelete(id);

    await auditLogService.log(actor, "STAFF_DELETED", "staff", id, {
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      message: `Staff account '${user.email}' removed successfully`,
    };
  }
}

export const staffService = new StaffService();
