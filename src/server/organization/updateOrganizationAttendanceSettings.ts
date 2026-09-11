"use server";

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

import { getAuthContext } from "../auth/getAuthContext";

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
  // 1. Validate input first
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

    // 3. Get active organization
    const organizationId =
      session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "No active organization found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // 4. Verify membership and permission
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
        "Only organization admins and owners can update attendance settings.",
        "FORBIDDEN",
      );
    }

    // 5. Create or update attendance settings
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

    // 6. Return success
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