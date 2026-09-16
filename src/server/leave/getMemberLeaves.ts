import "server-only";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { prisma } from "@/lib/prisma";

import type { LeaveTypeId } from "@/constants/leave";
import type { Leave } from "@/types/organization/leave";

type GetMemberLeavesParams = {
  organizationId: string;
  memberId: string;
};

export async function getMemberLeaves({
  organizationId,
  memberId,
}: GetMemberLeavesParams): Promise<ActionResult<Leave[]>> {
  const startedAt = performance.now();

  if (!organizationId) {
    console.warn("[getMemberLeaves] missing organizationId");

    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Organization ID is required.",
      "BAD_REQUEST",
    );
  }

  if (!memberId) {
    console.warn("[getMemberLeaves] missing memberId");

    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Member ID is required.",
      "BAD_REQUEST",
    );
  }

  try {
    const dbStartedAt = performance.now();

    const leaves = await prisma.leave.findMany({
      where: {
        organizationId,
        memberId,
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
      },
    });

    const dbTime = performance.now() - dbStartedAt;

    console.log(`[STAFFZENO] getMemberLeaves:db: ${dbTime.toFixed(2)} ms`);

    const result: Leave[] = leaves.map((leave) => ({
      ...leave,
      leaveType: leave.leaveType as LeaveTypeId,
    }));

    const totalTime = performance.now() - startedAt;

    console.log(
      `[STAFFZENO] getMemberLeaves:total: ${totalTime.toFixed(2)} ms`,
    );

    return actionResponse(
      ACTION_STATUS.OK,
      result,
      "Leave requests loaded successfully.",
    );
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    console.error(
      `[getMemberLeaves] unexpected error after ${totalTime.toFixed(2)} ms:`,
      error,
    );

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while loading leave requests. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
