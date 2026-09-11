import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { getAuthContext } from "@/server/auth/getAuthContext";

import type { Session } from "better-auth";

export type OrganizationRole = "member" | "admin" | "owner";

export type DashboardContext = {
  session: Session;

  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };

  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };

  membership: {
    id: string;
    role: OrganizationRole;
  };
};

export const getDashboardContext = cache(
  async (slug: string): Promise<ActionResult<DashboardContext>> => {
    const organizationSlug = slug.trim();

    if (!organizationSlug) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Organization slug is required.",
        "BAD_REQUEST",
      );
    }

    // Get authenticated user/session.
    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // Find organization.
    const organization = await prisma.organization.findUnique({
      where: {
        slug: organizationSlug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Organization not found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // Verify membership and get role.
    const membership = await prisma.member.findFirst({
      where: {
        organizationId: organization.id,
        userId: user.id,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!membership) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "FORBIDDEN",
      );
    }

    return actionResponse(ACTION_STATUS.OK, {
      session,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      },
      organization,
      membership: {
        id: membership.id,
        role: membership.role as OrganizationRole,
      },
    });
  },
);
