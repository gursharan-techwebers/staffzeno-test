"use server";

import "server-only";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getSession } from "../user/getSession";

type SetActiveOrganizationSuccess = {
  organizationId: string;
  organizationSlug: string;
};

export async function setActiveOrganizationBySlug(
  slug: string,
): Promise<ActionResult<SetActiveOrganizationSuccess>> {
  const organizationSlug = slug?.trim();

  if (!organizationSlug) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Organization slug is required.",
      "BAD_REQUEST",
    );
  }

  try {
    const requestHeaders = await headers();

    // 1. Get current session
    const session = await getSession();

    if (!session) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    // 2. Find organization by slug
    const organization = await prisma.organization.findUnique({
      where: {
        slug: organizationSlug,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Organization not found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // 3. Verify current user belongs to this organization
    const membership = await prisma.member.findFirst({
      where: {
        organizationId: organization.id,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "FORBIDDEN",
      );
    }

    // 4. Set active organization
    await auth.api.setActiveOrganization({
      body: {
        organizationId: organization.id,
      },
      headers: requestHeaders,
    });

    // 5. Return success
    return actionResponse(
      ACTION_STATUS.OK,
      {
        organizationId: organization.id,
        organizationSlug: organization.slug,
      },
      "Organization activated successfully.",
    );
  } catch (error) {
    // 6. Handle Better Auth errors
    if (error instanceof APIError) {
      console.error("[setActiveOrganizationBySlug] API error:", error);

      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to activate the organization.",
        "BAD_REQUEST",
      );
    }

    // 7. Handle unexpected errors
    console.error("[setActiveOrganizationBySlug] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to activate the organization. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
