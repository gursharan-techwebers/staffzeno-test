"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "../auth/getAuthContext";
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
    // 2. Authenticate
    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to add an organization holiday.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // 3. Get active organization
    const organizationId = session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You must have an active organization to add a holiday.",
        "FORBIDDEN",
      );
    }

    // 4. Verify organization membership and role
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
        "You are not a member of this organization.",
        "FORBIDDEN",
      );
    }

    // 5. Only owner/admin can add holidays
    if (member.role !== "owner" && member.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "Only organization owners and admins can add holidays.",
        "FORBIDDEN",
      );
    }

    // 6. Normalize the date
    const holidayDate = new Date(date);

    // 7. Check for an existing holiday on this date
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
