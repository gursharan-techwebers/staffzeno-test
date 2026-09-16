import "server-only";

import { prisma } from "@/lib/prisma";

import { getAuthContext } from "@/server/auth/getAuthContext";

import type { ManageLeave } from "@/types/organization/leave";

export async function getOrganizationAdminLeavesToManage(): Promise<
  ManageLeave[]
> {
  const authContext = await getAuthContext();

  if (!authContext) {
    return [];
  }

  const userId = authContext.user.id;
  const organizationId = authContext.session.activeOrganizationId;

  if (!organizationId) {
    return [];
  }

  const membership = await prisma.member.findFirst({
    where: {
      organizationId,
      userId,
      role: "admin",
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    return [];
  }

  const leaves = await prisma.leave.findMany({
    where: {
      organizationId,
      status: "PENDING",

      member: {
        role: "member",
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      organizationId: true,
      memberId: true,
      leaveType: true,
      startDate: true,
      endDate: true,
      duration: true,
      halfDayPeriod: true,
      startTime: true,
      endTime: true,
      requestedMinutes: true,
      reason: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      member: {
        select: {
          id: true,
          userId: true,
          role: true,
          title: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },

      approvals: {
        select: {
          id: true,
          approverMemberId: true,
          status: true,
          comment: true,
          actedAt: true,
        },
      },
    },
  });

  return leaves as ManageLeave[];
}
