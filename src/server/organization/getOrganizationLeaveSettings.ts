"use server";

import { prisma } from "@/lib/prisma";

import { getSession } from "../user/getSession";

export async function getOrganizationLeaveSettings() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const organizationId = session.session.activeOrganizationId;

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

  return settings;
}
