"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getAuthContext } from "../auth/getAuthContext";

type DeleteOrganizationHolidaySuccess = {
  holidayId: string;
};

export async function deleteOrganizationHoliday(
  holidayId: string,
): Promise<ActionResult<DeleteOrganizationHolidaySuccess>> {
  const normalizedHolidayId = holidayId?.trim();

  if (!normalizedHolidayId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Holiday ID is required.",
      "BAD_REQUEST",
    );
  }

  try {
    // 1. Authenticate current user
    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to delete an organization holiday.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // 2. Get active organization
    const organizationId = session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You must have an active organization to delete a holiday.",
        "FORBIDDEN",
      );
    }

    // 3. Verify current user's membership and permissions
    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId,
        userId: user.id,
      },
      select: {
        role: true,
      },
    });

    if (!currentMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "FORBIDDEN",
      );
    }

    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only organization owners and admins can delete holidays.",
        "FORBIDDEN",
      );
    }

    // 4. Find holiday scoped to the active organization
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

    // 5. Delete holiday
    await prisma.organizationHoliday.delete({
      where: {
        id: holiday.id,
      },
    });

    // 6. Return minimal success response
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