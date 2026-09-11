"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import {
  updateLeaveManagementSchema,
  type UpdateLeaveManagementInput,
} from "@/validators/organization/settings/leave";

import { getAuthContext } from "../auth/getAuthContext";

type UpdatedLeaveManagementSettings = {
  id: string;
  organizationId: string;
  monthlyPaidLeaves: number;
  monthlyPaidHalfDayLeaves: number;
  monthlyPaidShortLeaves: number;
  shortLeaveDuration: number;
  carryForwardEnabled: boolean;
  leaveEncashmentEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function updateLeaveManagement(
  values: UpdateLeaveManagementInput,
): Promise<ActionResult<UpdatedLeaveManagementSettings>> {
  // 1. Validate input first
  const validation = updateLeaveManagementSchema.safeParse(values);

  if (!validation.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please correct the highlighted fields.",
      "VALIDATION_ERROR",
      validation.error.flatten().fieldErrors,
    );
  }

  const data = validation.data;

  try {
    // 2. Get authenticated user/session
    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // 3. Get active organization from session
    const organizationId = session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "No active organization found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // 4. Verify organization membership + permission
    const member = await prisma.member.findFirst({
      where: {
        organizationId,
        userId: user.id,
      },
      select: {
        role: true,
      },
    });

    if (!member) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "FORBIDDEN",
      );
    }

    if (member.role !== "owner" && member.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only organization admins and owners can update leave settings.",
        "FORBIDDEN",
      );
    }

    // 5. Create or update leave settings
    const updatedSettings = await prisma.organizationLeaveSettings.upsert({
      where: {
        organizationId,
      },

      update: {
        monthlyPaidLeaves: data.monthlyPaidLeaves,
        monthlyPaidHalfDayLeaves: data.monthlyPaidHalfDayLeaves,
        monthlyPaidShortLeaves: data.monthlyPaidShortLeaves,
        shortLeaveDuration: data.shortLeaveDuration,
        carryForwardEnabled: data.carryForwardEnabled,
        leaveEncashmentEnabled: data.leaveEncashmentEnabled,
      },

      create: {
        id: crypto.randomUUID(),
        organizationId,
        monthlyPaidLeaves: data.monthlyPaidLeaves,
        monthlyPaidHalfDayLeaves: data.monthlyPaidHalfDayLeaves,
        monthlyPaidShortLeaves: data.monthlyPaidShortLeaves,
        shortLeaveDuration: data.shortLeaveDuration,
        carryForwardEnabled: data.carryForwardEnabled,
        leaveEncashmentEnabled: data.leaveEncashmentEnabled,
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

    // 6. Return success
    return actionResponse(
      ACTION_STATUS.OK,
      updatedSettings,
      "Your leave management settings have been updated.",
    );
  } catch (error) {
    console.error("[updateLeaveManagement] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to update leave management settings.",
      "UNKNOWN_ERROR",
    );
  }
}
