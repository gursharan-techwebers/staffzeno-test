import "server-only";

import { prisma } from "@/lib/prisma";
import { PLANS } from "@/config/plans";
import { getUserPlan } from "./getUserPlan";

type FeatureName =
  | "attendance"
  | "punchInOut"
  | "workingHours"
  | "leave"
  | "calendar"
  | "employeeManagement"
  | "invitations"
  | "payroll"
  | "advancedPermissions";

export async function canUseFeature(
  userId: string,
  organizationId: string,
  feature: FeatureName
): Promise<boolean> {
  const membership = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
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

  return PLANS[plan].features[feature];
}