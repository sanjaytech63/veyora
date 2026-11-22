import { apiClient } from "./api-client";
import {
  RoleDto,
  StaffUserDto,
  AuditLogDto,
  PermissionDefinition,
  CreateRoleInput,
  UpdateRoleInput,
  CreateStaffUserInput,
  UpdateStaffUserInput,
  StaffListQuery,
  AuditLogListQuery,
} from "@veyora/types";

export const adminRbacApi = {
  // Permissions
  getPermissions: (): Promise<PermissionDefinition[]> =>
    apiClient.get<PermissionDefinition[]>("/admin/permissions"),

  // Roles
  listRoles: (): Promise<RoleDto[]> =>
    apiClient.get<RoleDto[]>("/admin/roles"),

  getRole: (id: string): Promise<RoleDto> =>
    apiClient.get<RoleDto>(`/admin/roles/${id}`),

  createRole: (data: CreateRoleInput): Promise<RoleDto> =>
    apiClient.post<RoleDto>("/admin/roles", data),

  updateRole: (id: string, data: UpdateRoleInput): Promise<RoleDto> =>
    apiClient.put<RoleDto>(`/admin/roles/${id}`, data),

  deleteRole: (id: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete<{ success: boolean; message: string }>(`/admin/roles/${id}`),

  // Staff
  listStaff: (query?: StaffListQuery): Promise<{
    staff: StaffUserDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> =>
    apiClient.get("/admin/staff", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getStaff: (id: string): Promise<StaffUserDto> =>
    apiClient.get<StaffUserDto>(`/admin/staff/${id}`),

  createStaff: (data: CreateStaffUserInput): Promise<StaffUserDto> =>
    apiClient.post<StaffUserDto>("/admin/staff", data),

  updateStaff: (id: string, data: UpdateStaffUserInput): Promise<StaffUserDto> =>
    apiClient.put<StaffUserDto>(`/admin/staff/${id}`, data),

  updateStaffStatus: (
    id: string,
    isActive: boolean,
    statusReason?: string | null
  ): Promise<StaffUserDto> =>
    apiClient.patch<StaffUserDto>(`/admin/staff/${id}/status`, {
      isActive,
      statusReason,
    }),

  deleteStaff: (id: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete<{ success: boolean; message: string }>(`/admin/staff/${id}`),

  // Audit Logs
  listAuditLogs: (query?: AuditLogListQuery): Promise<{
    logs: AuditLogDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> =>
    apiClient.get("/admin/audit-logs", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),
};
