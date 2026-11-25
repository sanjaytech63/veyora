/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { roleService } from "../services/role.service";
import { staffService } from "../services/staff.service";
import { auditLogService } from "../services/audit-log.service";
import { PERMISSION_DEFINITIONS } from "../permission-registry";
import { ApiRbacCode } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

export class RbacController {
  /**
   * 1. GET /admin/permissions
   */
  public async getPermissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_PERMISSIONS_FETCHED,
        message: "Permission definitions retrieved successfully.",
        data: PERMISSION_DEFINITIONS,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. GET /admin/roles
   */
  public async listRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await roleService.listRoles();
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_ROLES_FETCHED,
        message: "Administrative roles retrieved successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. GET /admin/roles/:id
   */
  public async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await roleService.getRoleById(req.params.id as string);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_ROLE_FETCHED,
        message: "Role details retrieved successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 4. POST /admin/roles
   */
  public async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
      };
      const data = await roleService.createRole(actor, req.body);
      sendSuccess(res, {
        statusCode: 201,
        code: ApiRbacCode.RBAC_ROLE_CREATED,
        message: "Role created successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 5. PUT /admin/roles/:id
   */
  public async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
      };
      const data = await roleService.updateRole(actor, req.params.id as string, req.body);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_ROLE_UPDATED,
        message: "Role updated successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 6. DELETE /admin/roles/:id
   */
  public async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
      };
      const result = await roleService.deleteRole(actor, req.params.id as string);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_ROLE_DELETED,
        message: result.message || "Role deleted successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 7. GET /admin/staff
   */
  public async listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await staffService.listStaff(req.query as any);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_STAFF_FETCHED,
        message: "Staff directory retrieved successfully.",
        data,
        meta: {
          pagination: {
            page: data.page,
            limit: data.limit,
            total: data.total,
            totalPages: data.totalPages,
            hasNextPage: data.page < data.totalPages,
            hasPrevPage: data.page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 8. GET /admin/staff/:id
   */
  public async getStaffById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await staffService.getStaffById(req.params.id as string);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_STAFF_MEMBER_FETCHED,
        message: "Staff member details retrieved successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 9. POST /admin/staff
   */
  public async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
      };
      const data = await staffService.createStaff(actor, req.body);
      sendSuccess(res, {
        statusCode: 201,
        code: ApiRbacCode.RBAC_STAFF_CREATED,
        message: "Staff member enrolled successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 10. PUT /admin/staff/:id
   */
  public async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
      };
      const data = await staffService.updateStaff(actor, req.params.id as string, req.body);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_STAFF_UPDATED,
        message: "Staff member updated successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 11. PATCH /admin/staff/:id/status
   */
  public async updateStaffStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
      };
      const { isActive, statusReason } = req.body;
      const data = await staffService.updateStaffStatus(
        actor,
        req.params.id as string,
        Boolean(isActive),
        statusReason
      );
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_STAFF_STATUS_UPDATED,
        message: "Staff member status updated successfully.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 12. DELETE /admin/staff/:id
   */
  public async deleteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
      };
      const result = await staffService.deleteStaff(actor, req.params.id as string);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_STAFF_DELETED,
        message: result.message || "Staff member deleted successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 13. GET /admin/audit-logs
   */
  public async listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await auditLogService.queryLogs(req.query as any);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiRbacCode.RBAC_AUDIT_LOGS_FETCHED,
        message: "Audit logs retrieved successfully.",
        data,
        meta: {
          pagination: {
            page: data.page,
            limit: data.limit,
            total: data.total,
            totalPages: data.totalPages,
            hasNextPage: data.page < data.totalPages,
            hasPrevPage: data.page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const rbacController = new RbacController();
