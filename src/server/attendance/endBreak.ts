"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

import type { AttendanceActionState } from "@/types/organization/attendance";

type EndBreakInput = {
  attendanceId: string;
  sessionId: string;
  breakId: string;
};

export async function endBreak({
  attendanceId,
  sessionId,
  breakId,
}: EndBreakInput): Promise<AttendanceActionState> {
  const startedAt = performance.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      /**
       * ---------------------------------------------------------
       * 1. Resolve attendance
       * ---------------------------------------------------------
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
        },
      });

      if (!attendance) {
        throw new EndBreakError(
          "Attendance record was not found.",
          "ATTENDANCE_NOT_FOUND",
        );
      }

      /**
       * ---------------------------------------------------------
       * 2. Attendance must not be finalized
       * ---------------------------------------------------------
       */

      if (attendance.isFinalized) {
        throw new EndBreakError(
          "Today's attendance has already been finalized.",
          "ATTENDANCE_FINALIZED",
        );
      }

      /**
       * ---------------------------------------------------------
       * 3. Resolve session
       * ---------------------------------------------------------
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
        throw new EndBreakError(
          "Attendance session was not found.",
          "SESSION_NOT_FOUND",
        );
      }

      /**
       * ---------------------------------------------------------
       * 4. Session must belong to attendance
       * ---------------------------------------------------------
       */

      if (session.attendanceId !== attendance.id) {
        throw new EndBreakError(
          "The attendance session does not belong to this attendance record.",
          "SESSION_ATTENDANCE_MISMATCH",
        );
      }

      /**
       * ---------------------------------------------------------
       * 5. Session must currently be ON_BREAK
       * ---------------------------------------------------------
       */

      if (session.status === "PUNCHED_IN") {
        throw new EndBreakError(
          "You are not currently on a break.",
          "SESSION_NOT_ON_BREAK",
        );
      }

      if (session.status === "PUNCHED_OUT") {
        throw new EndBreakError(
          "You have already punched out.",
          "SESSION_ALREADY_PUNCHED_OUT",
        );
      }

      if (session.status !== "ON_BREAK") {
        throw new EndBreakError(
          "The attendance session is not in a valid state.",
          "INVALID_SESSION_STATE",
        );
      }

      /**
       * ---------------------------------------------------------
       * 6. Resolve the requested break
       * ---------------------------------------------------------
       */

      const breakRecord = await tx.attendanceBreak.findUnique({
        where: {
          id: breakId,
        },

        select: {
          id: true,
          sessionId: true,
          startedAt: true,
          endedAt: true,
        },
      });

      if (!breakRecord) {
        throw new EndBreakError(
          "Attendance break was not found.",
          "BREAK_NOT_FOUND",
        );
      }

      /**
       * ---------------------------------------------------------
       * 7. Break must belong to this session
       * ---------------------------------------------------------
       */

      if (breakRecord.sessionId !== session.id) {
        throw new EndBreakError(
          "The break does not belong to this attendance session.",
          "BREAK_SESSION_MISMATCH",
        );
      }

      /**
       * ---------------------------------------------------------
       * 8. Break must still be open
       * ---------------------------------------------------------
       */

      if (breakRecord.endedAt) {
        throw new EndBreakError(
          "This break has already ended.",
          "BREAK_ALREADY_ENDED",
        );
      }

      /**
       * ---------------------------------------------------------
       * 9. Capture exact break-end instant
       * ---------------------------------------------------------
       */

      const endedAt = new Date();

      /**
       * ---------------------------------------------------------
       * 10. Validate break timing
       * ---------------------------------------------------------
       */

      if (endedAt.getTime() < breakRecord.startedAt.getTime()) {
        throw new EndBreakError(
          "The break end time cannot be earlier than the break start time.",
          "INVALID_BREAK_TIMING",
        );
      }

      /**
       * ---------------------------------------------------------
       * 11. Calculate break duration
       * ---------------------------------------------------------
       */

      const durationMinutes = Math.max(
        0,
        Math.floor(
          (endedAt.getTime() - breakRecord.startedAt.getTime()) / 60000,
        ),
      );

      /**
       * ---------------------------------------------------------
       * 12. Close the break
       * ---------------------------------------------------------
       */

      await tx.attendanceBreak.update({
        where: {
          id: breakRecord.id,
        },

        data: {
          endedAt,
          durationMinutes,
        },
      });

      /**
       * ---------------------------------------------------------
       * 13. Return session to PUNCHED_IN
       *
       * IMPORTANT:
       * punchedInAt remains unchanged.
       *
       * Break time will be deducted when punchOut calculates
       * the session's actual worked minutes.
       * ---------------------------------------------------------
       */

      await tx.attendanceSession.update({
        where: {
          id: session.id,
        },

        data: {
          status: "PUNCHED_IN",
        },
      });

      /**
       * ---------------------------------------------------------
       * 14. Return client state
       * ---------------------------------------------------------
       */

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

    console.log(`[STAFFZENO] endBreak:total: ${totalTime.toFixed(2)} ms`);

    return result;
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    console.error(
      `[STAFFZENO] endBreak failed after ${totalTime.toFixed(2)} ms:`,
      error,
    );

    if (error instanceof EndBreakError) {
      throw error;
    }

    throw new Error(
      "Something went wrong while ending your break. Please try again.",
    );
  }
}

/**
 * -----------------------------------------------------------
 * End-break business error
 * -----------------------------------------------------------
 */

class EndBreakError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "EndBreakError";
  }
}
