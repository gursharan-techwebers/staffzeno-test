"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

import { ATTENDANCE_CONSTANTS } from "@/constants/organization";
import type { AttendanceActionState } from "@/types/organization/attendance";

type StartBreakInput = {
  attendanceId: string;
  sessionId: string;
};

export async function startBreak({
  attendanceId,
  sessionId,
}: StartBreakInput): Promise<AttendanceActionState> {
  const startedAt = performance.now();

  try {
    /**
     * ---------------------------------------------------------
     * Perform the complete state transition atomically.
     * ---------------------------------------------------------
     */

    const result = await prisma.$transaction(async (tx) => {
      /**
       * -------------------------------------------------------
       * 1. Resolve attendance
       * -------------------------------------------------------
       */

      const attendance = await tx.attendance.findUnique({
        where: {
          id: attendanceId,
        },

        select: {
          id: true,
          requiredMinutes: true,
          workedMinutes: true,
          regularMinutes: true,
          overtimeMinutes: true,
          shortfallMinutes: true,
          isFinalized: true,
          memberId: true,
          organizationId: true,
        },
      });

      if (!attendance) {
        throw new StartBreakError(
          "Attendance record was not found.",
          "ATTENDANCE_NOT_FOUND",
        );
      }

      /**
       * -------------------------------------------------------
       * 2. Attendance must not be finalized
       * -------------------------------------------------------
       */

      if (attendance.isFinalized) {
        throw new StartBreakError(
          "Today's attendance has already been finalized.",
          "ATTENDANCE_FINALIZED",
        );
      }

      /**
       * -------------------------------------------------------
       * 3. Resolve the requested session
       * -------------------------------------------------------
       */

      const session = await tx.attendanceSession.findUnique({
        where: {
          id: sessionId,
        },

        select: {
          id: true,
          attendanceId: true,
          status: true,
          punchedInAt: true,
          punchedOutAt: true,
        },
      });

      if (!session) {
        throw new StartBreakError(
          "Attendance session was not found.",
          "SESSION_NOT_FOUND",
        );
      }

      /**
       * -------------------------------------------------------
       * 4. Session must belong to this attendance
       * -------------------------------------------------------
       */

      if (session.attendanceId !== attendance.id) {
        throw new StartBreakError(
          "The attendance session does not belong to this attendance record.",
          "SESSION_ATTENDANCE_MISMATCH",
        );
      }

      /**
       * -------------------------------------------------------
       * 5. Session must currently be PUNCHED_IN
       * -------------------------------------------------------
       */

      if (session.status === "ON_BREAK") {
        throw new StartBreakError(
          "You are already on a break.",
          "ALREADY_ON_BREAK",
        );
      }

      if (session.status === "PUNCHED_OUT") {
        throw new StartBreakError(
          "You have already punched out. You cannot start a break.",
          "SESSION_ALREADY_PUNCHED_OUT",
        );
      }

      if (session.status !== "PUNCHED_IN") {
        throw new StartBreakError(
          "The attendance session is not in a valid state.",
          "INVALID_SESSION_STATE",
        );
      }

      /**
       * -------------------------------------------------------
       * 6. Minimum session duration
       *
       * Prevent starting a break immediately after punching in.
       *
       * This is a server-side validation. The client should also
       * disable the button for UX, but the server remains the
       * source of truth.
       * -------------------------------------------------------
       */

      const now = new Date();

      const elapsedMinutes = Math.floor(
        (now.getTime() - session.punchedInAt.getTime()) / 60000,
      );

      if (elapsedMinutes < ATTENDANCE_CONSTANTS.minimumSessionMinutes) {
        const remainingMinutes =
          ATTENDANCE_CONSTANTS.minimumSessionMinutes - elapsedMinutes;

        throw new StartBreakError(
          `You must work for at least ${ATTENDANCE_CONSTANTS.minimumSessionMinutes} minutes before starting a break. Please wait ${remainingMinutes} more minute${
            remainingMinutes === 1 ? "" : "s"
          }.`,
          "MINIMUM_SESSION_TIME_NOT_MET",
        );
      }

      /**
       * -------------------------------------------------------
       * 7. Make sure there is no other active session
       * -------------------------------------------------------
       */

      const otherActiveSession = await tx.attendanceSession.findFirst({
        where: {
          attendanceId: attendance.id,

          status: {
            in: ["PUNCHED_IN", "ON_BREAK"],
          },

          NOT: {
            id: session.id,
          },
        },

        select: {
          id: true,
          status: true,
        },
      });

      if (otherActiveSession) {
        throw new StartBreakError(
          "Another attendance session is currently active.",
          "OTHER_ACTIVE_SESSION",
        );
      }

      /**
       * -------------------------------------------------------
       * 8. Make sure there isn't already an open break
       * -------------------------------------------------------
       */

      const openBreak = await tx.attendanceBreak.findFirst({
        where: {
          sessionId: session.id,
          endedAt: null,
        },

        select: {
          id: true,
        },
      });

      if (openBreak) {
        throw new StartBreakError(
          "You already have an active break.",
          "ACTIVE_BREAK_EXISTS",
        );
      }

      /**
       * -------------------------------------------------------
       * 9. Create the break
       * -------------------------------------------------------
       */

      const breakRecord = await tx.attendanceBreak.create({
        data: {
          id: crypto.randomUUID(),

          sessionId: session.id,

          startedAt: now,
        },

        select: {
          id: true,
          startedAt: true,
        },
      });

      /**
       * -------------------------------------------------------
       * 10. Change session state to ON_BREAK
       * -------------------------------------------------------
       */

      await tx.attendanceSession.update({
        where: {
          id: session.id,
        },

        data: {
          status: "ON_BREAK",
        },
      });

      /**
       * -------------------------------------------------------
       * 11. Return client state
       * -------------------------------------------------------
       */

      return {
        status: "ON_BREAK" as const,

        attendanceId: attendance.id,

        sessionId: session.id,

        breakId: breakRecord.id,

        breakStartedAt: breakRecord.startedAt.toISOString(),

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

    console.log(`[STAFFZENO] startBreak:total: ${totalTime.toFixed(2)} ms`);

    return result;
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    console.error(
      `[STAFFZENO] startBreak failed after ${totalTime.toFixed(2)} ms:`,
      error,
    );

    if (error instanceof StartBreakError) {
      throw error;
    }

    throw new Error(
      "Something went wrong while starting your break. Please try again.",
    );
  }
}

/**
 * -----------------------------------------------------------
 * Start-break business error
 * -----------------------------------------------------------
 */

class StartBreakError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "StartBreakError";
  }
}
