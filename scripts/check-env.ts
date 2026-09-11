import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_COMPANY_NAME: z
    .string()
    .min(1, "NEXT_PUBLIC_COMPANY_NAME is required"),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),

  APP_LOGO_URL: z
    .string()
    .url("APP_LOGO_URL must be a valid URL"),

  BETTER_AUTH_SECRET: z
    .string()
    .min(1, "BETTER_AUTH_SECRET is required"),

  BETTER_AUTH_URL: z
    .string()
    .url("BETTER_AUTH_URL must be a valid URL"),

  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, "GOOGLE_CLIENT_ID is required"),

  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, "GOOGLE_CLIENT_SECRET is required"),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required"),

  EMAIL_FROM: z
    .string()
    .min(1, "EMAIL_FROM is required"),

  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY is required"),

  STRIPE_SECRET_KEY: z
    .string()
    .min(1, "STRIPE_SECRET_KEY is required"),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, "STRIPE_WEBHOOK_SECRET is required"),

  STAFFZENO_TEST_PLAN: z
    .string()
    .min(1, "STAFFZENO_TEST_PLAN is required"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("\n❌ Environment validation failed:\n");

  for (const issue of result.error.issues) {
    const variable = issue.path.join(".");
    console.error(`  ✗ ${variable}`);
    console.error(`    ${issue.message}\n`);
  }

  console.error("Fix the above variables in your .env file.");
  console.error("The application was NOT started.\n");

  process.exit(1);
}

console.log("Environment variables validated successfully.\n");