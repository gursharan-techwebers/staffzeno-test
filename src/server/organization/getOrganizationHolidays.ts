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
import { OrganizationHoliday } from "@/types/organization/holiday";

export async function getOrganizationHolidays(): Promise<
  ActionResult<OrganizationHoliday[]>
> {
  try {
    const requestHeaders = await headers();

    // 1. Check authentication
    const session = await getSession();

    if (!session?.user) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to view organization holidays.",
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
        "You must have an active organization to view holidays.",
        "FORBIDDEN",
      );
    }

    // 3. Get holidays for the active organization
    const holidays = await prisma.organizationHoliday.findMany({
      where: {
        organizationId: activeMember.organizationId,
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

    // 4. Return holidays
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
