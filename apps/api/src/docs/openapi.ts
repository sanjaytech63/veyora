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
  },
  components: {
    schemas: {
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
