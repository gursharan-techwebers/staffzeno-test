"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { LoginInput, loginSchema } from "@/validators/auth/auth";
import { AuthUserResult } from "@/types/auth/auth";

import { setLastActiveOrganizationCookie } from "@/server/organization/organizationCookie";
import { getPostLoginOrganization } from "../organization/getPostLoginOrganization";

type LoginSuccess = AuthUserResult & {
  organizationSlug: string | null;
};

export async function loginUser(
  input: LoginInput,
): Promise<ActionResult<LoginSuccess>> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please fix the highlighted fields.",
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { email, password } = parsed.data;

  try {
    // ---------------------------------------------------------
    // Sign in
    // ---------------------------------------------------------

    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: true,
      },
      headers: await headers(),
    });

    // ---------------------------------------------------------
    // Get the user's post-login organization
    // ---------------------------------------------------------

    const organization = await getPostLoginOrganization(result.user.id);

    // ---------------------------------------------------------
    // Remember the selected organization
    // ---------------------------------------------------------

    if (organization) {
      await setLastActiveOrganizationCookie(organization.organizationId);
    }

    // ---------------------------------------------------------
    // Return login result
    // ---------------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      {
        userId: result.user.id,
        email: result.user.email,
        organizationSlug: organization?.organizationSlug ?? null,
      },
      "Login successful.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        error.body?.message ?? "Invalid email or password.",
        "INVALID_CREDENTIALS",
      );
    }

    console.error("[loginUser] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
