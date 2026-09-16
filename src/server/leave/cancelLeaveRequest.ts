"use server";

import "server-only";

import { prisma } from "@/lib/prisma";
import { env } from "@/env";

import { LEAVE_TYPES } from "@/constants/leave";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { getAuthContext } from "@/server/auth/getAuthContext";

import { sendLeaveCancelledEmail } from "@/sendEmails/organization/sendLeaveCancelledEmail";

import type { Leave } from "@/types/organization/leave";
import type { LeaveTypeId } from "@/constants/leave";
import { formatLeaveDuration } from "@/lib/utils/formatLeaveDuration";

type CancelLeaveRequestParams = {
  leaveId: string;
};

export async function cancelLeaveRequest({
  leaveId,
}: CancelLeaveRequestParams): Promise<ActionResult<Leave>> {
  const startedAt = performance.now();

  const normalizedLeaveId = leaveId?.trim();

  if (!normalizedLeaveId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Leave ID is required.",
      "BAD_REQUEST",
    );
  }

  try {
    /**
     * ---------------------------------------------------------
     * 1. Authenticate current user
     * ---------------------------------------------------------
     */

    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be signed in to cancel a leave request.",
        "UNAUTHORIZED",
      );
    }

    const userId = authContext.user.id;

    /**
     * ---------------------------------------------------------
     * 2. Resolve active organization
     * ---------------------------------------------------------
     */

    const organizationId = authContext.session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "No active organization was found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    /**
     * ---------------------------------------------------------
     * 3. Get organization details
     * ---------------------------------------------------------
     *
     * We need the organization name for the email and the slug
     * to build the leave URL.
     */

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        name: true,
        slug: true,
      },
    });

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Organization not found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    /**
     * ---------------------------------------------------------
     * 4. Find the member belonging to authenticated user
     * ---------------------------------------------------------
     */

    const member = await prisma.member.findFirst({
      where: {
        organizationId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Your organization membership could not be found.",
        "MEMBER_NOT_FOUND",
      );
    }

    /**
     * ---------------------------------------------------------
     * 5. Find leave and assigned pending approvers
     * ---------------------------------------------------------
     *
     * We load the approval records before cancellation because
     * these are the people who need to be notified.
     */

    const leave = await prisma.leave.findFirst({
      where: {
        id: normalizedLeaveId,
        organizationId,
        memberId: member.id,
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
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },

        approvals: {
          where: {
            status: "PENDING",
          },
          select: {
            id: true,
            approverMember: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!leave) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Leave request not found or you do not have permission to cancel it.",
        "LEAVE_NOT_FOUND",
      );
    }

    /**
     * ---------------------------------------------------------
     * 6. Only pending leave requests can be cancelled
     * ---------------------------------------------------------
     */

    if (leave.status !== "PENDING") {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Only pending leave requests can be cancelled.",
        "INVALID_LEAVE_STATUS",
      );
    }

    /**
     * ---------------------------------------------------------
     * 7. Cancel the leave
     * ---------------------------------------------------------
     *
     * Repeat ownership + status checks to protect against
     * concurrent approval/cancellation requests.
     */

    const updatedLeave = await prisma.leave.updateMany({
      where: {
        id: normalizedLeaveId,
        organizationId,
        memberId: member.id,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (updatedLeave.count !== 1) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "The leave request could not be cancelled. It may have already been processed.",
        "LEAVE_UPDATE_FAILED",
      );
    }

    /**
     * ---------------------------------------------------------
     * 8. Send cancellation emails to pending approvers
     * ---------------------------------------------------------
     *
     * Email failures must NOT make the cancellation fail.
     */

    const leaveType =
      LEAVE_TYPES[leave.leaveType as keyof typeof LEAVE_TYPES]?.name ??
      leave.leaveType;

    const duration = formatLeaveDuration({
      duration: leave.duration,
      halfDayPeriod: leave.halfDayPeriod,
      startTime: leave.startTime,
      endTime: leave.endTime,
      startDate: leave.startDate,
      endDate: leave.endDate,
    });

    const leaveUrl = `${env.BETTER_AUTH_URL}/org/${organization.slug}/leaves`;

    const emailResults = await Promise.allSettled(
      leave.approvals.map((approval) =>
        sendLeaveCancelledEmail({
          email: approval.approverMember.user.email,
          name: approval.approverMember.user.name,
          employeeName: leave.member.user.name,
          organizationName: organization.name,
          leaveType,
          startDate: leave.startDate.toLocaleDateString(),
          endDate: leave.endDate.toLocaleDateString(),
          duration,
          reason: leave.reason || undefined,
          url: leaveUrl,
        }),
      ),
    );

    /**
     * Log email failures without failing cancellation.
     */

    emailResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `[cancelLeaveRequest] Failed to send cancellation email to approver ${leave.approvals[index]?.approverMember.user.email}:`,
          result.reason,
        );
      }
    });

    /**
     * ---------------------------------------------------------
     * 9. Return cancelled leave
     * ---------------------------------------------------------
     */

    const result: Leave = {
      ...leave,
      leaveType: leave.leaveType as LeaveTypeId,
      status: "CANCELLED",
      updatedAt: new Date(),
    };

    const totalTime = performance.now() - startedAt;

    console.log(
      `[STAFFZENO] cancelLeaveRequest:total: ${totalTime.toFixed(2)} ms`,
    );

    return actionResponse(
      ACTION_STATUS.OK,
      result,
      "Leave request cancelled successfully.",
    );
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    console.error(
      `[cancelLeaveRequest] unexpected error after ${totalTime.toFixed(2)} ms:`,
      error,
    );

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while cancelling the leave request. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
