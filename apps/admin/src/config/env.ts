import { adminEnvSchema, AdminEnv } from "@veyora/validators";

function parseEnv(): AdminEnv {
  const result = adminEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });

  if (!result.success) {
    console.error("FATAL: Invalid Admin console environment configuration:", result.error.flatten().fieldErrors);
    throw new Error("Invalid Admin environment configuration.");
  }

  return result.data;
}

export const env = parseEnv();
