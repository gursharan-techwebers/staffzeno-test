"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

import { LEAVE_TYPES } from "@/constants/leave";

import {
  leaveSchema,
  type LeaveInput,
} from "@/validators/organization/leave/leave";

import type {
  WorkingDay,
  WorkingSaturday,
} from "@/validators/organization/settings/attendance";

import type { ActionErrorCode } from "@/lib/actionResponse";

export type ValidatedLeaveRequest = {
  input: LeaveInput;
  startDate: Date;
  endDate: Date;
  requestedMinutes: number;
};

export type ValidateLeaveRequestResult =
  | {
      success: true;
      data: ValidatedLeaveRequest;
    }
  | {
      success: false;
      code: ActionErrorCode;
      message: string;
    };

export async function validateLeaveRequest(
  values: LeaveInput,
  organizationId: string,
): Promise<ValidateLeaveRequestResult> {
  /**
   * ---------------------------------------------------------
   * 1. Validate input
   * ---------------------------------------------------------
   */
  const parsed = leaveSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: "Please check the leave request details.",
    };
  }

  const input = parsed.data;

  /**
   * ---------------------------------------------------------
   * 2. Validate organization
   * ---------------------------------------------------------
   */
  if (!organizationId) {
    return {
      success: false,
      code: "ORGANIZATION_NOT_FOUND",
      message: "No active organization was found.",
    };
  }

  /**
   * ---------------------------------------------------------
   * 3. Validate leave type
   * ---------------------------------------------------------
   */
  const validLeaveType = Object.values(LEAVE_TYPES).some(
    (leaveType) => leaveType.id === input.leaveType,
  );

  if (!validLeaveType) {
    return {
      success: false,
      code: "INVALID_LEAVE_TYPE",
      message: "Invalid leave type.",
    };
  }

  /**
   * ---------------------------------------------------------
   * 4. Load organization settings
   * ---------------------------------------------------------
   */
  const [leaveSettings, attendanceSettings] = await Promise.all([
    prisma.organizationLeaveSettings.findUnique({
      where: {
        organizationId,
      },
      select: {
        shortLeaveDuration: true,
      },
    }),

    prisma.organizationAttendanceSettings.findUnique({
      where: {
        organizationId,
      },
      select: {
        workingDays: true,
        workingSaturdays: true,
      },
    }),
  ]);

  if (!leaveSettings) {
    return {
      success: false,
      code: "LEAVE_SETTINGS_REQUIRED",
      message: "Leave settings are not configured for this organization.",
    };
  }

  if (!attendanceSettings) {
    return {
      success: false,
      code: "ATTENDANCE_SETTINGS_REQUIRED",
      message: "Attendance settings are not configured for this organization.",
    };
  }

  /**
   * ---------------------------------------------------------
   * 5. Resolve dates
   * ---------------------------------------------------------
   *
   * Full Day:
   *   startDate only
   *
   * Multiple Days:
   *   startDate + endDate
   *
   * Half Day:
   *   startDate only
   *
   * Short Leave:
   *   startDate only
   *
   * Internally, every request gets both a startDate and
   * endDate so the rest of the validation can work consistently.
   */
  const startDate = new Date(`${input.startDate}T00:00:00.000Z`);

  if (Number.isNaN(startDate.getTime())) {
    return {
      success: false,
      code: "INVALID_DATE",
      message: "Invalid leave start date.",
    };
  }

  const endDateString =
    input.duration === "MULTIPLE_DAYS" ? input.endDate : input.startDate;

  if (!endDateString) {
    return {
      success: false,
      code: "INVALID_DATE",
      message: "Leave end date is required.",
    };
  }

  const endDate = new Date(`${endDateString}T00:00:00.000Z`);

  if (Number.isNaN(endDate.getTime())) {
    return {
      success: false,
      code: "INVALID_DATE",
      message: "Invalid leave end date.",
    };
  }

  /**
   * ---------------------------------------------------------
   * 6. Validate date range
   * ---------------------------------------------------------
   */
  if (endDate < startDate) {
    return {
      success: false,
      code: "INVALID_DATE_RANGE",
      message: "End date cannot be before the start date.",
    };
  }

  /**
   * ---------------------------------------------------------
   * 7. Load working days
   * ---------------------------------------------------------
   */
  const workingDays = attendanceSettings.workingDays as WorkingDay[];

  const workingSaturdays =
    attendanceSettings.workingSaturdays as WorkingSaturday[];

  /**
   * ---------------------------------------------------------
   * 8. Load organization holidays
   * ---------------------------------------------------------
   */
  const holidays = await prisma.organizationHoliday.findMany({
    where: {
      organizationId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      name: true,
    },
  });

  const holidayDates = new Set(
    holidays.map((holiday) => holiday.date.toISOString().slice(0, 10)),
  );

  /**
   * ---------------------------------------------------------
   * 9. Build requested dates
   * ---------------------------------------------------------
   */
  const requestedDates: Date[] = [];

  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    requestedDates.push(new Date(currentDate));

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  /**
   * ---------------------------------------------------------
   * 10. Saturday occurrence helper
   * ---------------------------------------------------------
   */
  const getSaturdayOccurrence = (date: Date): number => {
    let occurrence = 0;

    const current = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
    );

    while (current <= date) {
      if (current.getUTCDay() === 6) {
        occurrence++;
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return occurrence;
  };

  /**
   * ---------------------------------------------------------
   * 11. Validate working days and holidays
   * ---------------------------------------------------------
   */
  const weekdayNames: WorkingDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const invalidDates: string[] = [];

  for (const date of requestedDates) {
    const dateString = date.toISOString().slice(0, 10);

    /**
     * Organization holiday
     */
    if (holidayDates.has(dateString)) {
      invalidDates.push(`${dateString} is an organization holiday`);

      continue;
    }

    const dayOfWeek = date.getUTCDay();

    /**
     * Saturday
     */
    if (dayOfWeek === 6) {
      const saturdayOccurrence = getSaturdayOccurrence(date);

      const isWorkingSaturday = workingSaturdays.includes(
        saturdayOccurrence as WorkingSaturday,
      );

      if (!isWorkingSaturday) {
        invalidDates.push(`${dateString} is an organization off day`);
      }

      continue;
    }

    /**
     * Other weekdays
     */
    const dayName = weekdayNames[dayOfWeek];

    if (!workingDays.includes(dayName)) {
      invalidDates.push(`${dateString} is an organization off day`);
    }
  }

  if (invalidDates.length > 0) {
    return {
      success: false,
      code: "NON_WORKING_DAY",
      message:
        "Leave cannot be requested for an organization holiday or non-working day. " +
        `${invalidDates.join(", ")}.`,
    };
  }

  /**
   * ---------------------------------------------------------
   * 12. Calculate requested minutes
   * ---------------------------------------------------------
   */
  let requestedMinutes = 0;

  /**
   * Full Day
   */
  if (input.duration === "FULL_DAY") {
    requestedMinutes = 480;
  }

  /**
   * Multiple Days
   */
  if (input.duration === "MULTIPLE_DAYS") {
    requestedMinutes = requestedDates.length * 480;
  }

  /**
   * Half Day
   */
  if (input.duration === "HALF_DAY") {
    requestedMinutes = 240;
  }

  /**
   * Short Leave
   */
  if (input.duration === "SHORT_LEAVE") {
    const [startHour, startMinute] = input.startTime!.split(":").map(Number);

    const [endHour, endMinute] = input.endTime!.split(":").map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;

    const endTotalMinutes = endHour * 60 + endMinute;

    requestedMinutes = endTotalMinutes - startTotalMinutes;

    if (requestedMinutes <= 0) {
      return {
        success: false,
        code: "INVALID_SHORT_LEAVE_TIME",
        message: "End time must be after start time.",
      };
    }

    if (requestedMinutes > leaveSettings.shortLeaveDuration) {
      return {
        success: false,
        code: "SHORT_LEAVE_LIMIT_EXCEEDED",
        message: `Short leave cannot exceed ${leaveSettings.shortLeaveDuration} minutes.`,
      };
    }
  }

  /**
   * ---------------------------------------------------------
   * 13. Final duration validation
   * ---------------------------------------------------------
   */
  if (requestedMinutes <= 0) {
    return {
      success: false,
      code: "INVALID_DURATION",
      message: "The requested leave duration is invalid.",
    };
  }

  /**
   * ---------------------------------------------------------
   * 14. Return normalized result
   * ---------------------------------------------------------
   */
  return {
    success: true,
    data: {
      input,
      startDate,
      endDate,
      requestedMinutes,
    },
  };
}
