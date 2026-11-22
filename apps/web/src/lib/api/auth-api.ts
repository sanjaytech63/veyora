import { apiClient } from "./api-client";
import { AuthUser, SessionInfo } from "@veyora/types";
import {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@veyora/validators";

export interface AuthTokensResponse {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export interface RegisterResponse {
  user: AuthUser;
  message: string;
  otp?: string;
}

export interface MessageResponse {
  message: string;
  otp?: string;
}

export const authApi = {
  register: (data: RegisterInput) => apiClient.post<RegisterResponse>("/auth/register", data),

  verifyEmail: (data: VerifyOtpInput) =>
    apiClient.post<AuthTokensResponse>("/auth/verify-email", data),

  resendOtp: (data: ResendOtpInput) => apiClient.post<MessageResponse>("/auth/resend-otp", data),

  login: (data: LoginInput) => apiClient.post<AuthTokensResponse>("/auth/login", data),

  refreshToken: () =>
    apiClient.post<AuthTokensResponse>("/auth/refresh", undefined, { skipAuthRefresh: true }),

  logout: () => apiClient.post<MessageResponse>("/auth/logout"),

  forgotPassword: (data: ForgotPasswordInput) =>
    apiClient.post<MessageResponse>("/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordInput) =>
    apiClient.post<MessageResponse>("/auth/reset-password", data),

  getMe: () => apiClient.get<AuthUser>("/auth/me"),

  getSessions: () => apiClient.get<SessionInfo[]>("/auth/sessions"),

  revokeSession: (sessionId: string) =>
    apiClient.delete<MessageResponse>(`/auth/sessions/${sessionId}`),
};
