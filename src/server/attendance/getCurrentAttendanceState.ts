"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

import type { AttendanceActionState } from "@/types/organization/attendance";

import { getOrganizationAttendanceSettings } from "../organization/getOrganizationAttendanceSettings";

type GetCurrentAttendanceStateInput = {
  organizationId: string;
  memberId: string;
};

export async function getCurrentAttendanceState({
  organizationId,
  memberId,
}: GetCurrentAttendanceStateInput): Promise<AttendanceActionState> {
  const startedAt = performance.now();

  try {
    /**
     * ---------------------------------------------------------
     * 1. Resolve organization attendance settings
     * ---------------------------------------------------------
     */

    const settings = await getOrganizationAttendanceSettings({
      organizationId,
    });

    if (!settings) {
      console.error(
        "[STAFFZENO] Attendance settings have not been configured.",
      );

      return {
        status: "NOT_STARTED",
        attendanceId: null,
        workedMinutes: 0,
        requiredMinutes: 0,
      };
    }

    /**
     * ---------------------------------------------------------
     * 2. Resolve employee-specific working minutes
     *
     * customWorkingMinutes = null
     *     -> use organization default
     *
     * customWorkingMinutes = number
     *     -> use employee-specific requirement
     *
     * IMPORTANT:
     * This value is only used when today's Attendance record
     * does not exist yet.
     *
     * Once an Attendance record exists, its
     * Attendance.requiredMinutes is the source of truth.
     * ---------------------------------------------------------
     */

    const member = await prisma.member.findUnique({
      where: {
        id: memberId,
      },

      select: {
        customWorkingMinutes: true,
      },
    });

    if (!member) {
      throw new Error("Employee membership was not found.");
    }

    const defaultRequiredMinutes = settings.minimumWorkingMinutes;

    const effectiveRequiredMinutes =
      member.customWorkingMinutes ?? defaultRequiredMinutes;

    /**
     * ---------------------------------------------------------
     * 3. Determine today's organization-local date
     * ---------------------------------------------------------
     */

    const now = new Date();

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: settings.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(now);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      console.error("[STAFFZENO] Unable to determine today's attendance date.");

      return {
        status: "NOT_STARTED",
        attendanceId: null,
        workedMinutes: 0,

        // Employee-specific requirement when available.
        requiredMinutes: effectiveRequiredMinutes,
      };
    }

    const attendanceDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    /**
     * ---------------------------------------------------------
     * 4. Resolve today's attendance
     * ---------------------------------------------------------
     */

    const attendance = await prisma.attendance.findUnique({
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
        status: true,
        isFinalized: true,
        finalizedAt: true,

        sessions: {
          orderBy: {
            sessionNumber: "desc",
          },

          take: 1,

          select: {
            id: true,
            sessionNumber: true,
            status: true,
            punchedInAt: true,
            punchedOutAt: true,

            closedBy: true,

            breaks: {
              where: {
                endedAt: null,
              },

              orderBy: {
                startedAt: "desc",
              },

              take: 1,

              select: {
                id: true,
                startedAt: true,
                endedAt: true,
              },
            },
          },
        },
      },
    });

    /**
     * ---------------------------------------------------------
     * 5. No attendance record yet
     *
     * Use the employee-specific requirement or organization
     * default.
     * ---------------------------------------------------------
     */

    if (!attendance) {
      return {
        status: "NOT_STARTED",
        attendanceId: null,
        workedMinutes: 0,
        requiredMinutes: effectiveRequiredMinutes,
      };
    }

    /**
     * ---------------------------------------------------------
     * IMPORTANT:
     *
     * From this point forward, NEVER use
     * effectiveRequiredMinutes or settings.minimumWorkingMinutes
     * for this attendance.
     *
     * Attendance.requiredMinutes is the historical snapshot
     * created when the employee punched in.
     * ---------------------------------------------------------
     */

    /**
     * ---------------------------------------------------------
     * 7. Resolve latest session
     * ---------------------------------------------------------
     */

    const session = attendance.sessions[0];

    /**
     * ---------------------------------------------------------
     * 8. Attendance exists but no session
     * ---------------------------------------------------------
     */

    if (!session) {
      return {
        status: "NOT_STARTED",
        attendanceId: attendance.id,
        workedMinutes: attendance.workedMinutes,
        requiredMinutes: attendance.requiredMinutes,
      };
    }

    /**
     * ---------------------------------------------------------
     * 9. Currently on break
     * ---------------------------------------------------------
     */

    if (session.status === "ON_BREAK") {
      const activeBreak = session.breaks[0];

      /**
       * Session says ON_BREAK but no active break exists.
       * Do not throw an error to the client.
       * Log the database inconsistency and return WORKING
       * as the safe fallback state.
       */

      if (!activeBreak) {
        console.error(
          "[STAFFZENO] Session is marked ON_BREAK but no active break was found.",
          {
            attendanceId: attendance.id,
            sessionId: session.id,
          },
        );

        return {
          status: "WORKING",
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

      return {
        status: "ON_BREAK",
        attendanceId: attendance.id,
        sessionId: session.id,
        breakId: activeBreak.id,
        breakStartedAt: activeBreak.startedAt.toISOString(),
        punchedInAt: session.punchedInAt.toISOString(),
        workedMinutes: attendance.workedMinutes,
        requiredMinutes: attendance.requiredMinutes,
        regularMinutes: attendance.regularMinutes,
        overtimeMinutes: attendance.overtimeMinutes,
        shortfallMinutes: attendance.shortfallMinutes,
      };
    }

    /**
     * ---------------------------------------------------------
     * 10. Currently working
     * ---------------------------------------------------------
     */

    if (session.status === "PUNCHED_IN") {
      return {
        status: "WORKING",
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
     * ---------------------------------------------------------
     * 11. Current session is punched out
     * ---------------------------------------------------------
     */

    if (session.status === "PUNCHED_OUT") {
      /**
       * Punched out but timestamp is missing.
       * Log it server-side instead of throwing to the client.
       */

      if (!session.punchedOutAt) {
        console.error(
          "[STAFFZENO] Session is PUNCHED_OUT but punchedOutAt is missing.",
          {
            attendanceId: attendance.id,
            sessionId: session.id,
          },
        );

        return {
          status: "WORKING",
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
       * Punched out but closure source is missing.
       * Again, log server-side instead of throwing.
       */

      if (!session.closedBy) {
        console.error(
          "[STAFFZENO] Session is PUNCHED_OUT but closedBy is missing.",
          {
            attendanceId: attendance.id,
            sessionId: session.id,
          },
        );

        return {
          status: "WORKING",
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

      return {
        status: "PUNCHED_OUT",
        attendanceId: attendance.id,
        sessionId: session.id,
        punchedInAt: session.punchedInAt.toISOString(),
        punchedOutAt: session.punchedOutAt.toISOString(),
        closedBy: session.closedBy,
        workedMinutes: attendance.workedMinutes,
        requiredMinutes: attendance.requiredMinutes,
        regularMinutes: attendance.regularMinutes,
        overtimeMinutes: attendance.overtimeMinutes,
        shortfallMinutes: attendance.shortfallMinutes,
      };
    }

    /**
     * ---------------------------------------------------------
     * 12. Unexpected session state
     * ---------------------------------------------------------
     */

    console.error("[STAFFZENO] Attendance session is in an unexpected state.", {
      attendanceId: attendance.id,
      sessionId: session.id,
      sessionStatus: session.status,
    });

    return {
      status: "NOT_STARTED",
      attendanceId: attendance.id,
      workedMinutes: attendance.workedMinutes,
      requiredMinutes: attendance.requiredMinutes,
    };
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    console.error(
      `[STAFFZENO] getCurrentAttendanceState failed after ${totalTime.toFixed(
        2,
      )} ms:`,
      error,
    );

    /**
     * Never expose the internal/server error to the client.
     * Return a safe attendance state instead.
     */

    return {
      status: "NOT_STARTED",
      attendanceId: null,
      workedMinutes: 0,
      requiredMinutes: 0,
    };
  } finally {
    const totalTime = performance.now() - startedAt;

    console.log(
      `[STAFFZENO] getCurrentAttendanceState:total: ${totalTime.toFixed(2)} ms`,
    );
  }
}
