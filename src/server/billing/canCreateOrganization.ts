import "server-only";

import { prisma } from "@/lib/prisma";
import { PLANS } from "@/config/plans";
import { getUserPlan } from "./getUserPlan";

export async function canCreateOrganization(
  userId: string
): Promise<boolean> {
  const plan = await getUserPlan(userId);

  const organizationLimit =
    PLANS[plan].limits.organizations;

  const organizationCount = await prisma.organization.count({
    where: {
      createdById: userId,
    },
  });

  return organizationCount < organizationLimit;
}