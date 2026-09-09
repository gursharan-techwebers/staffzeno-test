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
  CreateOrganizationHolidayInput,
  createOrganizationHolidaySchema,
} from "@/validators/organization/holidays/holiday";

type CreateOrganizationHolidaySuccess = {
  holidayId: string;
  organizationId: string;
  name: string;
  date: Date;
  description: string | null;
};

export async function createOrganizationHoliday(
  input: CreateOrganizationHolidayInput,
): Promise<ActionResult<CreateOrganizationHolidaySuccess>> {
  // 1. Validate input
  const parsed = createOrganizationHolidaySchema.safeParse(input);

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
        "You must be logged in to add an organization holiday.",
        "UNAUTHORIZED",
      );
    }

    // 3. Get active organization membership
    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!activeMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You must have an active organization to add a holiday.",
        "FORBIDDEN",
      );
    }

    const organizationId = activeMember.organizationId;

    // 4. Only owner/admin can add holidays
    if (activeMember.role !== "owner" && activeMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only organization owners and admins can add holidays.",
        "FORBIDDEN",
      );
    }

    // 5. Make sure organization exists
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

    // 6. Normalize the date
    const holidayDate = new Date(date);

    // 7. Check if a holiday already exists on this date
    const existingHoliday = await prisma.organizationHoliday.findUnique({
      where: {
        organizationId_date: {
          organizationId,
          date: holidayDate,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingHoliday) {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "A holiday already exists for this date.",
        "CONFLICT",
      );
    }

    // 8. Create holiday
    const holiday = await prisma.organizationHoliday.create({
      data: {
        id: crypto.randomUUID(),
        organizationId,
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
      ACTION_STATUS.CREATED,
      {
        holidayId: holiday.id,
        organizationId: holiday.organizationId,
        name: holiday.name,
        date: holiday.date,
        description: holiday.description,
      },
      "Holiday added successfully.",
    );
  } catch (error) {
    console.error("[createOrganizationHoliday] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while adding the holiday. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
