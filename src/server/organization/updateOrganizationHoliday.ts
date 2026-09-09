"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getSession } from "../user/getSession";
import {
  UpdateOrganizationHolidayInput,
  updateOrganizationHolidaySchema,
} from "@/validators/organization/holidays/holiday";

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
  // 1. Validate input
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
    const requestHeaders = await headers();

    // 2. Check authentication
    const session = await getSession();

    if (!session?.user) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to edit an organization holiday.",
        "UNAUTHORIZED",
      );
    }

    // 3. Get active organization
    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!activeMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You must have an active organization to edit a holiday.",
        "FORBIDDEN",
      );
    }

    const organizationId = activeMember.organizationId;

    // 4. Only owner/admin can edit holidays
    if (activeMember.role !== "owner" && activeMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only organization owners and admins can edit holidays.",
        "FORBIDDEN",
      );
    }

    // 5. Normalize date
    const holidayDate = new Date(date);

    // 6. Find holiday belonging to active organization
    const holiday = await prisma.organizationHoliday.findFirst({
      where: {
        id: holidayId,
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

    // 7. Check if another holiday already uses the new date
    const existingHoliday = await prisma.organizationHoliday.findFirst({
      where: {
        organizationId,
        date: holidayDate,
        NOT: {
          id: holidayId,
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

    // 8. Update holiday
    const updatedHoliday = await prisma.organizationHoliday.update({
      where: {
        id: holidayId,
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

    // 9. Return success
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
