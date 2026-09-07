import "server-only";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getSession } from "./getSession";

export type OrganizationRole = "owner" | "admin" | "member";

export async function getCurrentUserRole(): Promise<OrganizationRole | null> {
  const requestHeaders = await headers();

  const session = await getSession();

  if (!session) {
    return null;
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return null;
  }

  const member = await prisma.member.findFirst({
    where: {
      organizationId,
      userId: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (!member) {
    return null;
  }

  if (
    member.role !== "owner" &&
    member.role !== "admin" &&
    member.role !== "member"
  ) {
    return null;
  }

  return member.role as OrganizationRole;
}
