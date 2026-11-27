import { z } from "zod";

/**
 * API Service Environment Schema
 */
export const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    API_PREFIX: z.string().default("/api/v1"),
    CORS_ORIGIN: z.string().default("*"),
    COOKIE_SECRET: z
      .string()
      .min(16, "COOKIE_SECRET must be at least 16 characters long")
      .default("veyora_secure_cookie_secret_dev_32chars"),
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SAME_SITE: z.enum(["lax", "none", "strict"]).optional().default("lax"),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 mins
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    BODY_LIMIT: z.string().default("10mb"),
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 characters long")
      .default("veyora_jwt_access_secret_super_secure_32chars_min"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 characters long")
      .default("veyora_jwt_refresh_secret_super_secure_32chars_min"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),
    OTP_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(10),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
    MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/veyora_dev"),
    REDIS_URL: z.string().optional(),
    REDIS_HOST: z.string().default("127.0.0.1"),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional().default(""),
    REDIS_TLS: z.coerce.boolean().optional().default(false),
    RAZORPAY_KEY_ID: z.string().min(1).default("rzp_test_U3As5vXTcofA3X"),
    RAZORPAY_KEY_SECRET: z.string().min(1).default("uNn0vIaNUov5gtKr6fl6cVUo"),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1).default("rzp_webhook_secret_789"),
    CLOUDINARY_CLOUD_NAME: z.string().min(1).default("veyora-cloud"),
    CLOUDINARY_API_KEY: z.string().min(1).default("veyora_cloud_api_key_12345"),
    CLOUDINARY_API_SECRET: z.string().min(1).default("veyora_cloud_api_secret_67890"),
    CLOUDINARY_UPLOAD_FOLDER: z.string().default("veyora"),
    ALLOW_TEST_PAYMENTS: z.coerce.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (data.JWT_ACCESS_SECRET === "veyora_jwt_access_secret_super_secure_32chars_min") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_ACCESS_SECRET"],
          message: "Production environment cannot use default fallback JWT_ACCESS_SECRET",
        });
      }
      if (data.JWT_REFRESH_SECRET === "veyora_jwt_refresh_secret_super_secure_32chars_min") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_REFRESH_SECRET"],
          message: "Production environment cannot use default fallback JWT_REFRESH_SECRET",
        });
      }
      if (data.COOKIE_SECRET === "veyora_secure_cookie_secret_dev_32chars") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["COOKIE_SECRET"],
          message: "Production environment cannot use default fallback COOKIE_SECRET",
        });
      }
      if (data.CORS_ORIGIN === "*") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CORS_ORIGIN"],
          message: "Production environment cannot use wildcard CORS_ORIGIN (*)",
        });
      }

      const productionSecretDefaults = [
        ["RAZORPAY_KEY_ID", "rzp_test_U3As5vXTcofA3X"],
        ["RAZORPAY_KEY_SECRET", "uNn0vIaNUov5gtKr6fl6cVUo"],
        ["RAZORPAY_WEBHOOK_SECRET", "rzp_webhook_secret_789"],
        ["CLOUDINARY_CLOUD_NAME", "veyora-cloud"],
        ["CLOUDINARY_API_KEY", "veyora_cloud_api_key_12345"],
        ["CLOUDINARY_API_SECRET", "veyora_cloud_api_secret_67890"],
      ] as const;

      for (const [key, fallback] of productionSecretDefaults) {
        const isRazorpayKey = key.startsWith("RAZORPAY_");
        if (isRazorpayKey && data.ALLOW_TEST_PAYMENTS) {
          continue;
        }

        if (
          data[key] === fallback ||
          (key === "RAZORPAY_KEY_ID" && data[key].startsWith("rzp_test_"))
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `Production environment cannot use the fallback ${key}`,
          });
        }
      }
    }
  });

export type ApiEnv = z.infer<typeof apiEnvSchema>;
