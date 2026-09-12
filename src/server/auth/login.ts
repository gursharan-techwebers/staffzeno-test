"use server";

import { APIError } from "better-auth/api";
import { cookies, headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";
import { LoginInput, loginSchema } from "@/validators/auth/auth";
import { AuthUserResult } from "@/types/auth/auth";

const LAST_ACTIVE_ORGANIZATION_COOKIE = "staffzeno_last_org_id";

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
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: true,
      },
      headers: await headers(),
    });

    const userId = result.user.id;

    // ---------------------------------------------------------
    // Find the user's last active organization from the cookie
    // ---------------------------------------------------------

    const cookieStore = await cookies();

    const lastOrganizationId = cookieStore.get(
      LAST_ACTIVE_ORGANIZATION_COOKIE,
    )?.value;

    let organizationSlug: string | null = null;

    // ---------------------------------------------------------
    // Validate the last organization
    // ---------------------------------------------------------

    if (lastOrganizationId) {
      const lastOrganization = await prisma.organization.findFirst({
        where: {
          id: lastOrganizationId,

          members: {
            some: {
              userId,
            },
          },
        },

        select: {
          id: true,
          slug: true,
        },
      });

      if (lastOrganization) {
        organizationSlug = lastOrganization.slug;
      }
    }

    // ---------------------------------------------------------
    // If last organization is unavailable,
    // fall back to the user's first organization
    // ---------------------------------------------------------

    if (!organizationSlug) {
      const firstOrganization = await prisma.organization.findFirst({
        where: {
          members: {
            some: {
              userId,
            },
          },
        },

        select: {
          id: true,
          slug: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      });

      organizationSlug = firstOrganization?.slug ?? null;

      // Update the cookie with the fallback organization.
      if (firstOrganization) {
        cookieStore.set(LAST_ACTIVE_ORGANIZATION_COOKIE, firstOrganization.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
    }

    return actionResponse(
      ACTION_STATUS.OK,
      {
        userId: result.user.id,
        email: result.user.email,
        organizationSlug,
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
