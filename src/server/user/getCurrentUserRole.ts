import "server-only";

import { prisma } from "@/lib/prisma";

import { getAuthContext } from "../auth/getAuthContext";

export type OrganizationRole = "owner" | "admin" | "member";

export async function getCurrentUserRole(): Promise<OrganizationRole | null> {
  const authContext = await getAuthContext();

  if (!authContext) {
    return null;
  }

  const { session, user } = authContext;

  const organizationId = session.activeOrganizationId;

  if (!organizationId) {
    return null;
  }

  const member = await prisma.member.findFirst({
    where: {
      organizationId,
      userId: user.id,
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
