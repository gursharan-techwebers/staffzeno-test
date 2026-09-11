"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import {
  UpdateOrganizationHolidayInput,
  updateOrganizationHolidaySchema,
} from "@/validators/organization/holidays/holiday";

import { getAuthContext } from "../auth/getAuthContext";

type UpdateOrganizationHolidaySuccess = {
  holidayId: string;
  organizationId: string;
  name: string;
  date: Date;
  description: string | null;
};

export async function updateOrganizationHoliday(
  holidayId: string,
  input: UpdateOrganizationHolidayInput,
): Promise<ActionResult<UpdateOrganizationHolidaySuccess>> {
  // 1. Validate holiday ID
  const normalizedHolidayId = holidayId?.trim();

  if (!normalizedHolidayId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Holiday ID is required.",
      "BAD_REQUEST",
    );
  }

  // 2. Validate input
  const parsed = updateOrganizationHolidaySchema.safeParse(input);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please fix the highlighted fields.",
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { name, date, description } = parsed.data;

  try {
    // 3. Get authenticated user/session
    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to edit an organization holiday.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // 4. Get active organization
    const organizationId = session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You must have an active organization to edit a holiday.",
        "FORBIDDEN",
      );
    }

    // 5. Verify membership and permission
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
        "Only organization owners and admins can edit holidays.",
        "FORBIDDEN",
      );
    }

    // 6. Normalize date
    const holidayDate = new Date(date);

    // 7. Verify holiday belongs to active organization
    const holiday = await prisma.organizationHoliday.findFirst({
      where: {
        id: normalizedHolidayId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!holiday) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Holiday not found.",
        "NOT_FOUND",
      );
    }

    // 8. Check for another holiday on the same date
    const existingHoliday = await prisma.organizationHoliday.findFirst({
      where: {
        organizationId,
        date: holidayDate,
        NOT: {
          id: normalizedHolidayId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingHoliday) {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "Another holiday already exists for this date.",
        "CONFLICT",
      );
    }

    // 9. Update holiday
    const updatedHoliday = await prisma.organizationHoliday.update({
      where: {
        id: normalizedHolidayId,
      },

      data: {
        name,
        date: holidayDate,
        description: description ?? null,
      },

      select: {
        id: true,
        organizationId: true,
        name: true,
        date: true,
        description: true,
      },
    });

    // 10. Return success
    return actionResponse(
      ACTION_STATUS.OK,
      {
        holidayId: updatedHoliday.id,
        organizationId: updatedHoliday.organizationId,
        name: updatedHoliday.name,
        date: updatedHoliday.date,
        description: updatedHoliday.description,
      },
      "Holiday updated successfully.",
    );
  } catch (error) {
    console.error("[updateOrganizationHoliday] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while updating the holiday. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
