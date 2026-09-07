import "server-only";

import { prisma } from "@/lib/prisma";
import { PLANS } from "@/config/plans";
import { getUserPlan } from "./getUserPlan";

export async function canAddEmployee(
  userId: string,
  organizationId: string,
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

  const employeeLimit = PLANS[plan].limits.employeesPerOrganization;

  const employeeCount = await prisma.member.count({
    where: {
      organizationId,
      role: {
        not: "owner",
      },
    },
  });

  const pendingInvitationCount = await prisma.invitation.count({
    where: {
      organizationId,
      status: "pending",
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return employeeCount + pendingInvitationCount < employeeLimit;
}
