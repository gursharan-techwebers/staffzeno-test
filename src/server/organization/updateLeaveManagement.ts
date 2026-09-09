"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
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

import { getSession } from "../user/getSession";

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
  try {
    // --------------------------------------------------
    // 1. Get current session
    // --------------------------------------------------

    const requestHeaders = await headers();

    const session = await getSession();

    if (!session?.user) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    // --------------------------------------------------
    // 2. Get active organization member
    // --------------------------------------------------

    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!activeMember) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "No active organization found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    const organizationId = activeMember.organizationId;

    // --------------------------------------------------
    // 3. Check organization permission
    // --------------------------------------------------

    if (
      activeMember.role !== "owner" &&
      activeMember.role !== "admin"
    ) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only organization admins and owners can update leave settings.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 4. Validate input
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 5. Check organization exists
    // --------------------------------------------------

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Organization not found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 6. Create or update leave settings
    // --------------------------------------------------

    const updatedSettings =
      await prisma.organizationLeaveSettings.upsert({
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

    // --------------------------------------------------
    // 7. Return success
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      updatedSettings,
      "Your leave management settings have been updated.",
    );
  } catch (error) {
    console.error(
      "[updateLeaveManagement] unexpected error:",
      error,
    );

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to update leave management settings.",
      "UNKNOWN_ERROR",
    );
  }
}