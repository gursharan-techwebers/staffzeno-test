import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    APP_LOGO_URL: z.string().url().optional(),

    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),

    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    DATABASE_URL: z.string().min(1),

    EMAIL_FROM: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),

    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),

    STAFFZENO_TEST_PLAN: z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_COMPANY_NAME: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },

  runtimeEnv: {
    APP_LOGO_URL: process.env.APP_LOGO_URL,

    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    DATABASE_URL: process.env.DATABASE_URL,

    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    STAFFZENO_TEST_PLAN: process.env.STAFFZENO_TEST_PLAN,

    NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});