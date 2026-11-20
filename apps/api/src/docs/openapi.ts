import { SERVICES } from "@veyora/config";
import { env } from "../config/env";

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: `${SERVICES.NAME} Core REST API`,
    version: SERVICES.VERSION,
    description: "Production-oriented modular REST API foundation for Veyora platform.",
    contact: {
      name: "Veyora Engineering",
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: "Local development server",
    },
    {
      url: `http://localhost:${env.PORT}`,
      description: "Root server (Health checks & Documentation)",
    },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Platform Health Summary",
        description: "Returns process uptime, memory metrics, and runtime environment.",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthCheckResponse",
                },
              },
            },
          },
        },
      },
    },
    "/health/live": {
      get: {
        tags: ["System"],
        summary: "Liveness Probe",
        description: "Returns 200 if the process is responsive.",
        responses: {
          "200": {
            description: "Process alive",
          },
        },
      },
    },
    "/health/ready": {
      get: {
        tags: ["System"],
        summary: "Readiness Probe",
        description: "Checks MongoDB and Redis dependencies before routing traffic.",
        responses: {
          "200": {
            description: "All dependencies connected",
          },
          "503": {
            description: "One or more dependencies disconnected",
          },
        },
      },
    },
    "/system/info": {
      get: {
        tags: ["System"],
        summary: "System Runtime Metadata",
        description: "Returns platform version, node runtime, and environment descriptor.",
        responses: {
          "200": {
            description: "System metadata retrieved",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SystemInfoResponse",
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Customer Registration",
        description: "Register a new customer account and send email verification OTP.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Registration successful",
          },
          "409": {
            description: "Email already registered",
          },
          "422": {
            description: "Validation error",
          },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        tags: ["Authentication"],
        summary: "Verify Email via OTP",
        description: "Verify email address using the 6-digit OTP code and issue auth tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/VerifyOtpRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Email verified successfully, tokens issued",
          },
          "400": {
            description: "Invalid or expired OTP",
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Customer Login",
        description: "Authenticate customer with email and password.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful, tokens issued",
          },
          "401": {
            description: "Invalid credentials or unverified email",
          },
        },
      },
    },
    "/auth/admin/login": {
      post: {
        tags: ["Authentication"],
        summary: "Administrator Login",
        description: "Authenticate administrator with role verification.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Admin login successful",
          },
          "403": {
            description: "Forbidden - Administrator privileges required",
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh Access Token",
        description: "Rotate refresh token and issue a fresh access token.",
        responses: {
          "200": {
            description: "Tokens refreshed successfully",
          },
          "401": {
            description: "Invalid or revoked refresh token",
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout",
        description: "Revoke active session and clear HTTP-only cookies.",
        responses: {
          "200": {
            description: "Logged out successfully",
          },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Forgot Password",
        description: "Initiate password reset via OTP.",
        responses: {
          "200": {
            description: "Reset code dispatched if account exists",
          },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Reset Password",
        description: "Reset password using verified OTP code.",
        responses: {
          "200": {
            description: "Password reset successfully",
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Current Authenticated User",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Profile retrieved",
          },
          "401": {
            description: "Unauthenticated",
          },
        },
      },
    },
    "/auth/sessions": {
      get: {
        tags: ["Authentication"],
        summary: "User Active Sessions",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Session list retrieved",
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "firstName", "lastName"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
          firstName: { type: "string" },
          lastName: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", minLength: 6, maxLength: 6 },
        },
      },
      HealthCheckResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              service: { type: "string", example: "@veyora/api" },
              environment: { type: "string", example: "development" },
              uptime: { type: "number", example: 42 },
              timestamp: { type: "string", format: "date-time" },
              memory: {
                type: "object",
                properties: {
                  heapUsedMB: { type: "number", example: 35.4 },
                  heapTotalMB: { type: "number", example: 52.1 },
                  rssMB: { type: "number", example: 78.9 },
                },
              },
            },
          },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      SystemInfoResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              service: { type: "string", example: "@veyora/api" },
              version: { type: "string", example: "0.1.0" },
              environment: { type: "string", example: "development" },
              nodeVersion: { type: "string", example: "v24.13.0" },
              platform: { type: "string", example: "win32" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      ApiErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Validation failed" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
