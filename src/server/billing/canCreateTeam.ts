import "server-only";

import { prisma } from "@/lib/prisma";
import { PLANS } from "@/config/plans";
import { getUserPlan } from "./getUserPlan";

export async function canCreateTeam(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const membership = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return false;
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return false;
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      createdById: true,
    },
  });

  if (!organization) {
    return false;
  }

  const plan = await getUserPlan(organization.createdById);

  const teamLimit = PLANS[plan].limits.teams;

  if (teamLimit === "unlimited") {
    return true;
  }

  const teamCount = await prisma.team.count({
    where: {
      organizationId,
    },
  });

  return teamCount < teamLimit;
}
