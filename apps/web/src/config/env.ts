import { webEnvSchema, WebEnv } from "@veyora/validators";

function parseEnv(): WebEnv {
  const result = webEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });

  if (!result.success) {
    console.error("FATAL: Invalid Web storefront environment configuration:", result.error.flatten().fieldErrors);
    throw new Error("Invalid Web environment configuration.");
  }

  return result.data;
}

export const env = parseEnv();
