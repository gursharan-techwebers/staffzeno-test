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

  const settings = await prisma.organizationLeaveSettings.findUnique({
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

  // No leave settings configured yet.
  if (!settings) {
    return null;
  }

  return settings;
}
