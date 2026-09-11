import { createAuthClient } from "better-auth/react";
import {
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
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
