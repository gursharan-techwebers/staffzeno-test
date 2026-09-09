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

type DeleteOrganizationHolidaySuccess = {
  holidayId: string;
};

export async function deleteOrganizationHoliday(
  holidayId: string,
): Promise<ActionResult<DeleteOrganizationHolidaySuccess>> {
  try {
    const requestHeaders = await headers();

    // 1. Check authentication
    const session = await getSession();

    if (!session?.user) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to delete an organization holiday.",
        "UNAUTHORIZED",
      );
    }

    // 2. Get active organization
    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!activeMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You must have an active organization to delete a holiday.",
        "FORBIDDEN",
      );
    }

    const organizationId = activeMember.organizationId;

    // 3. Only owner/admin can delete holidays
    if (activeMember.role !== "owner" && activeMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only organization owners and admins can delete holidays.",
        "FORBIDDEN",
      );
    }

    // 4. Find holiday belonging to active organization
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

    // 5. Delete holiday
    await prisma.organizationHoliday.delete({
      where: {
        id: holiday.id,
      },
    });

    // 6. Return success
    return actionResponse(
      ACTION_STATUS.OK,
      {
        holidayId: holiday.id,
      },
      "Holiday deleted successfully.",
    );
  } catch (error) {
    console.error("[deleteOrganizationHoliday] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while deleting the holiday. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
