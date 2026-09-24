"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

import type { AttendanceActionState } from "@/types/organization/attendance";
import { getOrganizationAttendanceSettings } from "../organization/getOrganizationAttendanceSettings";

type PunchInInput = {
  organizationId: string;
  memberId: string;
};

export async function punchIn({
  organizationId,
  memberId,
}: PunchInInput): Promise<AttendanceActionState> {
  const startedAt = performance.now();

  try {
    /**
     * ---------------------------------------------------------
     * 1. Get and validate organization attendance settings
     * ---------------------------------------------------------
     *
     * This is the source of truth for:
     * - Organization timezone
     * - Required working minutes
     * - Grace period
     * - Finalization window
     * - Working days
     * - Working Saturdays
     *
     * We intentionally use this existing helper instead of
     * querying OrganizationAttendanceSettings directly.
     */

    const settings = await getOrganizationAttendanceSettings({
      organizationId,
    });

    if (!settings) {
      throw new PunchInError(
        "Attendance settings are not configured.",
        "SETTINGS_NOT_CONFIGURED",
      );
    }

    /**
     * ---------------------------------------------------------
     * 2. Capture the exact punch-in instant
     * ---------------------------------------------------------
     *
     * Date represents the exact instant the punch occurred.
     *
     * We do NOT convert this Date into the organization's
     * timezone before storing it.
     */

    const now = new Date();

    /**
     * ---------------------------------------------------------
     * 3. Resolve today's organization-local calendar date
     * ---------------------------------------------------------
     *
     * The organization's timezone determines which attendance
     * day this punch belongs to.
     */

    const attendanceDate = getOrganizationDate(now, settings.timezone);

    /**
     * ---------------------------------------------------------
     * 4. Perform punch-in atomically
     * ---------------------------------------------------------
     */

    const result = await prisma.$transaction(async (tx) => {
      /**
       * -------------------------------------------------------
       * Resolve employee-specific working minutes
       * -------------------------------------------------------
       *
       * If the employee has a custom value, use it.
       * Otherwise, fall back to the organization default.
       */

      const member = await tx.member.findUnique({
        where: {
          id: memberId,
        },

        select: {
          customWorkingMinutes: true,
        },
      });

      if (!member) {
        throw new PunchInError(
          "Employee membership was not found.",
          "MEMBER_NOT_FOUND",
        );
      }

      const requiredMinutes =
        member.customWorkingMinutes ?? settings.minimumWorkingMinutes;

      /**
       * -------------------------------------------------------
       * Check pending / approved leave
       * -------------------------------------------------------
       */

      const leave = await tx.leave.findFirst({
        where: {
          organizationId,
          memberId,

          status: {
            in: ["PENDING", "APPROVED"],
          },

          startDate: {
            lte: attendanceDate,
          },

          endDate: {
            gte: attendanceDate,
          },
        },

        select: {
          id: true,
          status: true,
        },
      });

      if (leave) {
        throw new PunchInError(
          leave.status === "APPROVED"
            ? "You are on approved leave and cannot punch in."
            : "You have a pending leave request and cannot punch in.",
          "LEAVE_EXISTS",
        );
      }

      /**
       * -------------------------------------------------------
       * Find today's attendance
       * -------------------------------------------------------
       */

      let attendance = await tx.attendance.findUnique({
        where: {
          organizationId_memberId_date: {
            organizationId,
            memberId,
            date: attendanceDate,
          },
        },

        select: {
          id: true,
          requiredMinutes: true,
          workedMinutes: true,
          regularMinutes: true,
          overtimeMinutes: true,
          shortfallMinutes: true,
          isFinalized: true,
        },
      });

      /**
       * -------------------------------------------------------
       * No attendance exists
       *
       * Create today's attendance and first session.
       * -------------------------------------------------------
       */

      if (!attendance) {
        attendance = await tx.attendance.create({
          data: {
            id: crypto.randomUUID(),

            organizationId,
            memberId,

            /**
             * Organization-local calendar date.
             */
            date: attendanceDate,

            /**
             * Store the organization's timezone on the
             * attendance record so historical records retain
             * the timezone that was used for that day.
             */
            timezone: settings.timezone,

            /**
             * Required working minutes come directly from
             * validated organization attendance settings.
             */
            requiredMinutes,

            workedMinutes: 0,

            regularMinutes: 0,

            overtimeMinutes: 0,

            shortfallMinutes: requiredMinutes,

            status: "INCOMPLETE",

            isFinalized: false,
          },

          select: {
            id: true,
            requiredMinutes: true,
            workedMinutes: true,
            regularMinutes: true,
            overtimeMinutes: true,
            shortfallMinutes: true,
            isFinalized: true,
          },
        });

        /**
         * -----------------------------------------------------
         * Create first attendance session
         * -----------------------------------------------------
         */

        const session = await tx.attendanceSession.create({
          data: {
            id: crypto.randomUUID(),

            attendanceId: attendance.id,

            sessionNumber: 1,

            status: "PUNCHED_IN",

            /**
             * Exact instant of punch-in.
             */
            punchedInAt: now,
          },

          select: {
            id: true,
            punchedInAt: true,
          },
        });

        return {
          status: "WORKING" as const,
          attendanceId: attendance.id,
          sessionId: session.id,
          punchedInAt: session.punchedInAt.toISOString(),
          workedMinutes: attendance.workedMinutes,
          requiredMinutes: attendance.requiredMinutes,
          regularMinutes: attendance.regularMinutes,
          overtimeMinutes: attendance.overtimeMinutes,
          shortfallMinutes: attendance.shortfallMinutes,
        };
      }

      /**
       * -------------------------------------------------------
       * Attendance already finalized
       * -------------------------------------------------------
       */

      if (attendance.isFinalized) {
        throw new PunchInError(
          "Today's attendance has already been finalized.",
          "ATTENDANCE_FINALIZED",
        );
      }

      /**
       * -------------------------------------------------------
       * Check for any active session
       *
       * Only one active session is allowed at a time.
       * -------------------------------------------------------
       */

      const activeSession = await tx.attendanceSession.findFirst({
        where: {
          attendanceId: attendance.id,

          status: {
            in: ["PUNCHED_IN", "ON_BREAK"],
          },
        },

        select: {
          id: true,
          status: true,
        },
      });

      if (activeSession) {
        if (activeSession.status === "ON_BREAK") {
          throw new PunchInError(
            "You are currently on a break. End your break before punching in again.",
            "ACTIVE_BREAK",
          );
        }

        throw new PunchInError(
          "You are already punched in.",
          "ALREADY_PUNCHED_IN",
        );
      }

      /**
       * -------------------------------------------------------
       * Find latest session
       * -------------------------------------------------------
       */

      const latestSession = await tx.attendanceSession.findFirst({
        where: {
          attendanceId: attendance.id,
        },

        orderBy: {
          sessionNumber: "desc",
        },

        select: {
          id: true,
          sessionNumber: true,
          status: true,
        },
      });

      /**
       * -------------------------------------------------------
       * Previous session must be properly closed
       * -------------------------------------------------------
       */

      if (latestSession && latestSession.status !== "PUNCHED_OUT") {
        throw new PunchInError(
          "Your previous attendance session is not properly closed.",
          "INVALID_SESSION_STATE",
        );
      }

      /**
       * -------------------------------------------------------
       * Create next attendance session
       * -------------------------------------------------------
       */

      const nextSessionNumber = (latestSession?.sessionNumber ?? 0) + 1;

      const session = await tx.attendanceSession.create({
        data: {
          id: crypto.randomUUID(),

          attendanceId: attendance.id,

          sessionNumber: nextSessionNumber,

          status: "PUNCHED_IN",

          /**
           * Exact instant of punch-in.
           */
          punchedInAt: now,
        },

        select: {
          id: true,
          punchedInAt: true,
        },
      });

      return {
        status: "WORKING" as const,
        attendanceId: attendance.id,
        sessionId: session.id,
        punchedInAt: session.punchedInAt.toISOString(),
        workedMinutes: attendance.workedMinutes,
        requiredMinutes: attendance.requiredMinutes,
        regularMinutes: attendance.regularMinutes,
        overtimeMinutes: attendance.overtimeMinutes,
        shortfallMinutes: attendance.shortfallMinutes,
      };
    });

    /**
     * ---------------------------------------------------------
     * Performance
     * ---------------------------------------------------------
     */

    const totalTime = performance.now() - startedAt;

    console.log(`[STAFFZENO] punchIn:total: ${totalTime.toFixed(2)} ms`);

    return result;
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    console.error(
      `[STAFFZENO] punchIn failed after ${totalTime.toFixed(2)} ms:`,
      error,
    );

    if (error instanceof PunchInError) {
      throw error;
    }

    throw new Error(
      "Something went wrong while punching in. Please try again.",
    );
  }
}

/**
 * -----------------------------------------------------------
 * Punch-in business error
 * -----------------------------------------------------------
 */

class PunchInError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "PunchInError";
  }
}

/**
 * -----------------------------------------------------------
 * Get organization-local calendar date.
 *
 * The organization's IANA timezone determines the calendar
 * day to which the attendance belongs.
 *
 * The returned Date represents that calendar date at UTC
 * midnight for consistent storage in Attendance.date.
 * -----------------------------------------------------------
 */

function getOrganizationDate(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,

    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;

  const month = parts.find((part) => part.type === "month")?.value;

  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to determine organization attendance date.");
  }

  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}
