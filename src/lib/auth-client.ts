import { createAuthClient } from "better-auth/react";
import {
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import { env } from "@/env";

export const authClient = createAuthClient({
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    lastLoginMethodClient(),
    stripeClient({
      subscription: true,
    }),
    organizationClient(),
    organizationClient({
      teams: {
        enabled: true,
      },
    }),
  ],
});

export const { signIn, signUp, useSession } = createAuthClient();
