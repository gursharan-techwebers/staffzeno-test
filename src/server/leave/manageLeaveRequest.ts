"use server";

import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { getAuthContext } from "@/server/auth/getAuthContext";

import type { ManageLeave } from "@/types/organization/leave";
import { LEAVE_TYPES } from "@/constants/leave";
import { sendLeaveDecisionEmail } from "@/sendEmails/organization/sendLeaveDecisionEmail";
import { env } from "@/env";
import { formatLeaveDuration } from "@/lib/utils/formatLeaveDuration";

const manageLeaveRequestSchema = z
  .object({
    leaveId: z.string().min(1, "Leave ID is required."),

    action: z.enum(["APPROVE", "REJECT"], {
      error: "Invalid leave action.",
    }),

    comment: z
      .string()
      .trim()
      .max(1000, "Comment cannot exceed 1000 characters.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "REJECT" && !data.comment) {
      ctx.addIssue({
        code: "custom",
        path: ["comment"],
        message: "Please provide a reason for rejecting this leave request.",
      });
    }
  });

export type ManageLeaveRequestInput = z.infer<typeof manageLeaveRequestSchema>;

export async function manageLeaveRequest(
  values: ManageLeaveRequestInput,
): Promise<ActionResult<ManageLeave>> {
  const startedAt = performance.now();

  /**
   * ---------------------------------------------------------
   * 1. Validate input
   * ---------------------------------------------------------
   */

  const parsed = manageLeaveRequestSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Invalid leave management request.",
      "VALIDATION_ERROR",
      fieldErrors,
    );
  }

  const { leaveId, action, comment } = parsed.data;

  try {
    /**
     * ---------------------------------------------------------
     * 2. Authenticate user
     * ---------------------------------------------------------
     */

    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be signed in to manage leave requests.",
        "UNAUTHORIZED",
      );
    }

    const userId = authContext.user.id;
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
     * 3. Resolve current user's membership
     * ---------------------------------------------------------
     */

    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId,
        userId,
      },
      select: {
        id: true,
        userId: true,
        role: true,
      },
    });

    if (!currentMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "MEMBERSHIP_NOT_FOUND",
      );
    }

    /**
     * ---------------------------------------------------------
     * 4. Resolve organization owner
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

    const isOwner = organization.createdById === userId;
    const isAdmin = currentMember.role === "admin";

    /**
     * Only owner and organization admin can manage leave.
     */

    if (!isOwner && !isAdmin) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have permission to manage leave requests.",
        "FORBIDDEN",
      );
    }

    /**
     * ---------------------------------------------------------
     * 5. Load leave and assigned approval
     * ---------------------------------------------------------
     *
     * The approval record is the source of truth for
     * who is allowed to approve/reject this leave.
     */

    const leave = await prisma.leave.findFirst({
      where: {
        id: leaveId,
        organizationId,
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
          where: {
            approverMemberId: currentMember.id,
          },
          select: {
            id: true,
            approverMemberId: true,
            status: true,
            comment: true,
            actedAt: true,
          },
          take: 1,
        },
      },
    });

    if (!leave) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Leave request not found.",
        "LEAVE_NOT_FOUND",
      );
    }

    /**
     * ---------------------------------------------------------
     * 6. Verify leave is still pending
     * ---------------------------------------------------------
     */

    if (leave.status !== "PENDING") {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        `This leave request has already been ${leave.status.toLowerCase()}.`,
        "LEAVE_ALREADY_PROCESSED",
      );
    }

    /**
     * ---------------------------------------------------------
     * 7. Verify assigned approver
     * ---------------------------------------------------------
     */

    const approval = leave.approvals[0];

    if (!approval) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You are not assigned to manage this leave request.",
        "NOT_ASSIGNED_APPROVER",
      );
    }

    if (approval.status !== "PENDING") {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "This leave approval has already been processed.",
        "APPROVAL_ALREADY_PROCESSED",
      );
    }

    /**
     * ---------------------------------------------------------
     * 8. Verify approval hierarchy
     * ---------------------------------------------------------
     *
     * Normal member leave:
     *   → Organization admin approves
     *
     * Organization admin leave:
     *   → Organization owner approves
     */

    if (leave.member.role === "admin") {
      /**
       * Admin leave can only be managed by the owner.
       */

      if (!isOwner) {
        return actionResponse(
          ACTION_STATUS.FORBIDDEN,
          "Only the organization owner can manage administrator leave requests.",
          "OWNER_REQUIRED",
        );
      }
    } else {
      /**
       * Normal member leave can only be managed by
       * an organization admin.
       */

      if (!isAdmin) {
        return actionResponse(
          ACTION_STATUS.FORBIDDEN,
          "Only an organization administrator can manage member leave requests.",
          "ADMIN_REQUIRED",
        );
      }
    }

    /**
     * Prevent the requester from approving their own leave.
     */

    if (leave.member.userId === userId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You cannot approve or reject your own leave request.",
        "SELF_APPROVAL_NOT_ALLOWED",
      );
    }

    /**
     * ---------------------------------------------------------
     * 9. Determine new statuses
     * ---------------------------------------------------------
     */

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    /**
     * ---------------------------------------------------------
     * 10. Atomic update
     * ---------------------------------------------------------
     *
     * Both Leave and LeaveApproval must change together.
     *
     * The PENDING condition also protects against two
     * simultaneous approval/rejection requests.
     */

    const updatedLeave = await prisma.$transaction(async (tx) => {
      const leaveUpdate = await tx.leave.updateMany({
        where: {
          id: leave.id,
          organizationId,
          status: "PENDING",
        },
        data: {
          status: newStatus,
        },
      });

      if (leaveUpdate.count !== 1) {
        throw new Error("LEAVE_ALREADY_PROCESSED");
      }

      const approvalUpdate = await tx.leaveApproval.updateMany({
        where: {
          id: approval.id,
          approverMemberId: currentMember.id,
          status: "PENDING",
        },
        data: {
          status: newStatus,
          comment: comment || null,
          actedAt: new Date(),
        },
      });

      if (approvalUpdate.count !== 1) {
        throw new Error("APPROVAL_ALREADY_PROCESSED");
      }

      return tx.leave.findUniqueOrThrow({
        where: {
          id: leave.id,
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
    });

    /**
     * ---------------------------------------------------------
     * 11. Notify employee about the decision
     * ---------------------------------------------------------
     */

    try {
      const leaveType =
        LEAVE_TYPES[leave.leaveType as keyof typeof LEAVE_TYPES]?.name ??
        leave.leaveType;

      const duration = formatLeaveDuration({
        duration: updatedLeave.duration,
        halfDayPeriod: updatedLeave.halfDayPeriod,
        startTime: updatedLeave.startTime,
        endTime: updatedLeave.endTime,
        startDate: updatedLeave.startDate,
        endDate: updatedLeave.endDate,
      });

      await sendLeaveDecisionEmail({
        email: updatedLeave.member.user.email,
        name: updatedLeave.member.user.name,
        organizationName: organization.name,
        leaveType,
        startDate: updatedLeave.startDate.toLocaleDateString(),
        endDate: updatedLeave.endDate.toLocaleDateString(),
        duration,
        status: newStatus,
        approverName: authContext.user.name,
        reason: action === "REJECT" ? comment || undefined : undefined,
        url: `${env.BETTER_AUTH_URL}/org/${organization.slug}/leave`,
      });
    } catch (emailError) {
      console.error(
        "[manageLeaveRequest] Failed to send leave decision email:",
        emailError,
      );
    }

    /**
     * ---------------------------------------------------------
     * 11. Return success
     * ---------------------------------------------------------
     */

    const totalTime = performance.now() - startedAt;

    console.log(
      `[STAFFZENO] manageLeaveRequest:${action}: ${totalTime.toFixed(2)} ms`,
    );

    return actionResponse(
      ACTION_STATUS.OK,
      updatedLeave as ManageLeave,
      action === "APPROVE"
        ? "Leave request approved successfully."
        : "Leave request rejected successfully.",
    );
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    if (error instanceof Error && error.message === "LEAVE_ALREADY_PROCESSED") {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "The leave request has already been processed.",
        "LEAVE_ALREADY_PROCESSED",
      );
    }

    if (
      error instanceof Error &&
      error.message === "APPROVAL_ALREADY_PROCESSED"
    ) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "The leave request has already been processed.",
        "APPROVAL_ALREADY_PROCESSED",
      );
    }

    console.error(
      `[manageLeaveRequest] unexpected error after ${totalTime.toFixed(2)} ms:`,
      error,
    );

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while managing the leave request. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
