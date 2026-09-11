import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendVerification } from "@/sendEmails/auth/verificationEmail";
import { getFirstName } from "./utils";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod, organization } from "better-auth/plugins";
import { sendPasswordReset } from "@/sendEmails/auth/forgotPasswordEmail";
import { sendPasswordResetConfirmation } from "@/sendEmails/auth/resetPasswordEmail";
import { hashPassword, verifyPassword } from "./password";
import { sendOrganizationInvitation } from "@/sendEmails/auth/sendOrganizationInvitation";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import { env } from "@/env";

const stripeClient = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia", // Latest API version as of Stripe SDK v22.0.0
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: env.BETTER_AUTH_URL,
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const verificationUrl = new URL(url);
      verificationUrl.searchParams.set("callbackURL", "/login");
      await sendVerification({
        name: getFirstName(user.name),
        email: user.email,
        url: verificationUrl.toString(),
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    autoSignInAfterVerification: true,
    revokeSessionsOnPasswordReset: true,
    onExistingUserSignUp: async ({ user }) => {
      console.log(`Someone tried to sign up with ${user.email}`);
    },
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordReset({
        name: getFirstName(user.name),
        email: user.email,
        url,
      });
      console.log("Sending reset password email to:", user.email);
    },
    onPasswordReset: async ({ user }) => {
      await sendPasswordResetConfirmation({
        name: getFirstName(user.name),
        email: user.email,
        changedAt: new Date().toLocaleString(),
      });
    },
  },
  socialProviders: {
    google: {
      prompt: "select_account consent",
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
      accessType: "offline",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh after 1 day of inactivity
  },
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
    }),
    lastLoginMethod(),
    organization({
      teams: {
        enabled: true,
        allowRemovingAllTeams: false,
      },
      schema: {
        organization: {
          additionalFields: {
            createdById: {
              type: "string",
              required: true,
              input: true,
            },
          },
        },
        member: {
          additionalFields: {
            title: {
              type: "string",
              required: true,
              input: true,
            },
          },
        },

        invitation: {
          additionalFields: {
            title: {
              type: "string",
              required: true,
              input: true,
            },
          },
        },
      },
      async sendInvitationEmail(data) {
        const invitation = data.invitation as typeof data.invitation & {
          title: string;
        };

        const inviteLink = `${env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;

        await sendOrganizationInvitation({
          email: data.email,
          invitedByName: data.inviter.user.name,
          organizationName: data.organization.name,
          inviteLink,
          title: invitation.title,
        });
      },
    }),
    nextCookies(),
  ],
});
