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
  updateAttendanceSettingsSchema,
  type UpdateAttendanceSettingsInput,
} from "@/validators/organization/settings/attendance";

import { getSession } from "../user/getSession";

type UpdatedAttendanceSettings = {
  id: string;
  organizationId: string;
  officeStartTime: string;
  officeEndTime: string;
  gracePeriod: number;
  workingDays: string[];
  workingSaturdays: number[];
  createdAt: Date;
  updatedAt: Date;
};

export async function updateOrganizationAttendanceSettings(
  values: UpdateAttendanceSettingsInput,
): Promise<ActionResult<UpdatedAttendanceSettings>> {
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
        "Only organization admins and owners can update attendance settings.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 4. Validate input
    // --------------------------------------------------

    const validation =
      updateAttendanceSettingsSchema.safeParse(values);

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

    const organization =
      await prisma.organization.findUnique({
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
    // 6. Create or update attendance settings
    // --------------------------------------------------

    const updatedSettings =
      await prisma.organizationAttendanceSettings.upsert({
        where: {
          organizationId,
        },

        update: {
          officeStartTime: data.officeStartTime,
          officeEndTime: data.officeEndTime,
          gracePeriod: data.gracePeriod,
          workingDays: data.workingDays,
          workingSaturdays: data.workingSaturdays,
        },

        create: {
          id: crypto.randomUUID(),
          organizationId,
          officeStartTime: data.officeStartTime,
          officeEndTime: data.officeEndTime,
          gracePeriod: data.gracePeriod,
          workingDays: data.workingDays,
          workingSaturdays: data.workingSaturdays,
        },

        select: {
          id: true,
          organizationId: true,
          officeStartTime: true,
          officeEndTime: true,
          gracePeriod: true,
          workingDays: true,
          workingSaturdays: true,
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
      "Your attendance and working hour settings have been updated.",
    );
  } catch (error) {
    console.error(
      "[updateOrganizationAttendanceSettings] unexpected error:",
      error,
    );

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to update attendance and working hour settings.",
      "UNKNOWN_ERROR",
    );
  }
}