"use server";

import "server-only";

import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { env } from "@/env";

import { ACTIVE_LEAVE_TYPES, LEAVE_TYPES } from "@/constants/leave";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { getAuthContext } from "@/server/auth/getAuthContext";
import { validateLeaveRequest } from "@/server/leave/validateLeaveRequest";

import { sendLeaveRequestEmail } from "@/sendEmails/organization/sendLeaveRequestEmail";

import type { Leave } from "@/types/organization/leave";
import type { LeaveTypeId } from "@/constants/leave";

import type { LeaveInput } from "@/validators/organization/leave/leave";
import { formatLeaveDuration } from "@/lib/utils/formatLeaveDuration";

type CreateLeaveRequestResult = Leave;

export async function createLeaveRequest(
  values: LeaveInput,
): Promise<ActionResult<CreateLeaveRequestResult>> {
  const startedAt = performance.now();

  try {
    /**
     * ---------------------------------------------------------
     * 1. Authenticate user
     * ---------------------------------------------------------
     */

    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be signed in to request leave.",
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
     * 3. Resolve authenticated user's membership
     * ---------------------------------------------------------
     */

    const member = await prisma.member.findFirst({
      where: {
        organizationId,
        userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!member) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You are not a member of this organization.",
        "MEMBERSHIP_REQUIRED",
      );
    }

    /**
     * ---------------------------------------------------------
     * 4. Validate leave request
     * ---------------------------------------------------------
     */

    const validation = await validateLeaveRequest(values, organizationId);

    if (!validation.success) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        validation.message,
        validation.code,
      );
    }

    const { input, startDate, endDate, requestedMinutes } = validation.data;

    /**
     * ---------------------------------------------------------
     * 5. Check for existing pending/approved leave
     * ---------------------------------------------------------
     */

    const existingLeave = await prisma.leave.findFirst({
      where: {
        organizationId,
        memberId: member.id,

        status: {
          in: ["PENDING", "APPROVED"],
        },

        startDate: {
          lte: endDate,
        },

        endDate: {
          gte: startDate,
        },
      },

      select: {
        id: true,
        startDate: true,
        endDate: true,
        duration: true,
        status: true,
      },
    });

    if (existingLeave) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "You already have a pending or approved leave request for one or more of the selected dates.",
        "LEAVE_DATE_ALREADY_EXISTS",
      );
    }

    /**
     * ---------------------------------------------------------
     * 6. Resolve organization
     * ---------------------------------------------------------
     */

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdById: true,
      },
    });

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Organization not found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    const isAdmin = member.role === "admin";
    const isOwner = organization.createdById === userId;

    /**
     * ---------------------------------------------------------
     * 7. Owner leave is currently not supported
     * ---------------------------------------------------------
     */

    if (isOwner) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Owner leave requests are not currently supported.",
        "OWNER_LEAVE_NOT_SUPPORTED",
      );
    }

    /**
     * ---------------------------------------------------------
     * 8. Resolve all approvers
     * ---------------------------------------------------------
     *
     * Regular member:
     *   → All organization admins
     *
     * Organization admin:
     *   → Organization owner
     */

    type Approver = {
      memberId: string;
      userId: string;
      name: string;
      email: string;
    };

    let approvers: Approver[] = [];

    if (isAdmin) {
      /**
       * Admin leave → organization owner.
       */

      const ownerMember = await prisma.member.findFirst({
        where: {
          organizationId,
          userId: organization.createdById,
          role: "owner",
        },
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (ownerMember) {
        approvers = [
          {
            memberId: ownerMember.id,
            userId: ownerMember.userId,
            name: ownerMember.user.name,
            email: ownerMember.user.email,
          },
        ];
      }
    } else {
      /**
       * Regular member leave → all organization admins.
       */

      const adminMembers = await prisma.member.findMany({
        where: {
          organizationId,
          role: "admin",
        },
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      approvers = adminMembers.map((admin) => ({
        memberId: admin.id,
        userId: admin.userId,
        name: admin.user.name,
        email: admin.user.email,
      }));
    }

    /**
     * ---------------------------------------------------------
     * 9. Validate approvers
     * ---------------------------------------------------------
     */

    if (approvers.length === 0) {
      return actionResponse(
        ACTION_STATUS.INTERNAL_SERVER_ERROR,
        "No organization administrator is available to approve this leave request.",
        "APPROVER_NOT_FOUND",
      );
    }

    /**
     * Prevent self-approval.
     */

    approvers = approvers.filter((approver) => approver.memberId !== member.id);

    if (approvers.length === 0) {
      return actionResponse(
        ACTION_STATUS.INTERNAL_SERVER_ERROR,
        "A leave request cannot be assigned to the requesting member for approval.",
        "INVALID_APPROVER",
      );
    }

    /**
     * ---------------------------------------------------------
     * 10. Create leave + approvals atomically
     * ---------------------------------------------------------
     */

    const createdLeave = await prisma.$transaction(async (tx) => {
      const leave = await tx.leave.create({
        data: {
          id: randomUUID(),

          organizationId,
          memberId: member.id,

          leaveType: input.leaveType,

          startDate,
          endDate,

          duration: input.duration,

          halfDayPeriod: input.halfDayPeriod ?? null,

          startTime: input.startTime || null,

          endTime: input.endTime || null,

          requestedMinutes,

          reason: input.reason,

          status: "PENDING",
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

      /**
       * Create an approval record for every approver.
       */
      await tx.leaveApproval.createMany({
        data: approvers.map((approver) => ({
          id: randomUUID(),
          leaveId: leave.id,
          approverMemberId: approver.memberId,
          status: "PENDING",
        })),
      });

      return leave;
    });

    /**
     * ---------------------------------------------------------
     * 11. Send email to all approvers
     * ---------------------------------------------------------
     *
     * Email failure must NOT fail the leave request.
     */

    const leaveType =
      LEAVE_TYPES[input.leaveType as keyof typeof LEAVE_TYPES]?.name ??
      input.leaveType;

    const duration = formatLeaveDuration({
      duration: createdLeave.duration,
      halfDayPeriod: createdLeave.halfDayPeriod,
      startTime: createdLeave.startTime,
      endTime: createdLeave.endTime,
      startDate: createdLeave.startDate,
      endDate: createdLeave.endDate,
    });

    const employeeName = authContext.user.name;

    const leaveUrl = `${env.BETTER_AUTH_URL}/org/${organization.slug}/leave`;

    await Promise.allSettled(
      approvers.map((approver) =>
        sendLeaveRequestEmail({
          email: approver.email,
          name: approver.name,
          employeeName,
          organizationName: organization.name,
          leaveType,
          startDate: startDate.toLocaleDateString(),
          endDate: endDate.toLocaleDateString(),
          duration,
          reason: input.reason || undefined,
          url: leaveUrl,
        }),
      ),
    );

    /**
     * ---------------------------------------------------------
     * 12. Return created leave
     * ---------------------------------------------------------
     */

    const result: Leave = {
      ...createdLeave,
      leaveType: createdLeave.leaveType as LeaveTypeId,
    };

    const totalTime = performance.now() - startedAt;

    console.log(
      `[STAFFZENO] createLeaveRequest:total: ${totalTime.toFixed(2)} ms`,
    );

    return actionResponse(
      ACTION_STATUS.OK,
      result,
      "Leave request submitted successfully.",
    );
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    console.error(
      `[createLeaveRequest] unexpected error after ${totalTime.toFixed(2)} ms:`,
      error,
    );

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while submitting your leave request. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
