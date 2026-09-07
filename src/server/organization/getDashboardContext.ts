import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getSession } from "../user/getSession";

export type OrganizationRole = "member" | "admin" | "owner";

export type DashboardContext = {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
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
  headers: Headers;
};

export async function getDashboardContext(
  slug: string,
): Promise<ActionResult<DashboardContext>> {
  const organizationSlug = slug.trim();

  if (!organizationSlug) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Organization slug is required.",
      "BAD_REQUEST",
    );
  }

  const requestHeaders = await headers();

  // 1. Get session
  const session = await getSession();

  if (!session) {
    return actionResponse(
      ACTION_STATUS.UNAUTHORIZED,
      "You must be logged in.",
      "UNAUTHORIZED",
    );
  }

  // 2. Find requested organization
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

  // 3. Get current user's membership
  const membership = await prisma.member.findFirst({
    where: {
      organizationId: organization.id,
      userId: session.user.id,
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

  // 4. Set active organization
  await auth.api.setActiveOrganization({
    body: {
      organizationId: organization.id,
    },
    headers: requestHeaders,
  });

  // 5. Return dashboard context
  return actionResponse(ACTION_STATUS.OK, {
    session,
    organization,
    membership: {
      id: membership.id,
      role: membership.role as OrganizationRole,
    },
    headers: requestHeaders,
  });
}
