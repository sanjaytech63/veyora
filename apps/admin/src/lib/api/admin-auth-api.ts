import { apiClient } from "./api-client";
import { AuthUser } from "@veyora/types";
import { LoginInput } from "@veyora/validators";

export interface AdminAuthResponse {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export interface AdminMessageResponse {
  message: string;
}

export const adminAuthApi = {
  login: (data: LoginInput) => apiClient.post<AdminAuthResponse>("/auth/admin/login", data),

  refreshToken: () =>
    apiClient.post<AdminAuthResponse>("/auth/refresh", undefined, { skipAuthRefresh: true }),

  logout: () => apiClient.post<AdminMessageResponse>("/auth/logout"),

  getMe: () => apiClient.get<AuthUser>("/auth/me"),
};
