import "server-only";

import { prisma } from "@/lib/prisma";

type GetOrganizationLeaveSettingsParams = {
  organizationId: string;
};

export async function getOrganizationLeaveSettings({
  organizationId,
}: GetOrganizationLeaveSettingsParams) {
  if (!organizationId) {
    return null;
  }

  return prisma.organizationLeaveSettings.findUnique({
    where: {
      organizationId,
    },

    select: {
      id: true,
      organizationId: true,
      monthlyPaidLeaves: true,
      monthlyPaidHalfDayLeaves: true,
      monthlyPaidShortLeaves: true,
      shortLeaveDuration: true,
      carryForwardEnabled: true,
      leaveEncashmentEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
