import "server-only";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { prisma } from "@/lib/prisma";
import { OrganizationHoliday } from "@/types/organization/holiday";

type GetOrganizationHolidaysParams = {
  organizationId: string;
};

export async function getOrganizationHolidays({
  organizationId,
}: GetOrganizationHolidaysParams): Promise<
  ActionResult<OrganizationHoliday[]>
> {
  if (!organizationId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Organization ID is required.",
      "BAD_REQUEST",
    );
  }

  try {
    const holidays = await prisma.organizationHoliday.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        date: "asc",
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        date: true,
        description: true,
      },
    });

    return actionResponse(
      ACTION_STATUS.OK,
      holidays,
      "Organization holidays loaded successfully.",
    );
  } catch (error) {
    console.error("[getOrganizationHolidays] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while loading organization holidays. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
