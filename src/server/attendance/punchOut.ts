"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

import { ATTENDANCE_CONSTANTS } from "@/constants/organization";
import type { AttendanceActionState } from "@/types/organization/attendance";
import { workSummarySchema } from "@/validators/organization/attendance/attendance";
import { AttendanceSessionClosedBy } from "@/generated/prisma/enums";

type PunchOutInput = {
  attendanceId: string;
  sessionId: string;
  workSummary?: string | null;
  closedBy: "SYSTEM" | "EMPLOYEE";
};

export async function punchOut({
  attendanceId,
  sessionId,
  workSummary,
  closedBy: requestedClosedBy,
}: PunchOutInput): Promise<AttendanceActionState> {
  const startedAt = performance.now();

  const isSystemPunchOut = requestedClosedBy === "SYSTEM";

  const closedBy = isSystemPunchOut
    ? AttendanceSessionClosedBy.SYSTEM
    : AttendanceSessionClosedBy.EMPLOYEE;

  let validatedWorkSummary: string | null = null;

  if (isSystemPunchOut) {
    validatedWorkSummary = null;
  } else {
    const summaryValidation = workSummarySchema.safeParse(workSummary);

    if (!summaryValidation.success) {
      throw new PunchOutError(
        summaryValidation.error.issues[0]?.message ??
          "Please provide a valid work summary.",
        "INVALID_WORK_SUMMARY",
      );
    }

    validatedWorkSummary = summaryValidation.data;
  }

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
          status: true,
          isFinalized: true,
        },
      });

      if (!attendance) {
        throw new PunchOutError(
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
        throw new PunchOutError(
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
          sessionNumber: true,
          status: true,
          punchedInAt: true,
          punchedOutAt: true,
          totalSessionMinutes: true,
          totalBreakMinutes: true,
          workedMinutes: true,
        },
      });

      if (!session) {
        throw new PunchOutError(
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
        throw new PunchOutError(
          "The attendance session does not belong to this attendance record.",
          "SESSION_ATTENDANCE_MISMATCH",
        );
      }

      /**
       * ---------------------------------------------------------
       * 5. Session must currently be PUNCHED_IN
       * ---------------------------------------------------------
       */

      if (session.status === "ON_BREAK") {
        throw new PunchOutError(
          "You are currently on a break. Please end your break before punching out.",
          "SESSION_ON_BREAK",
        );
      }

      if (session.status === "PUNCHED_OUT") {
        throw new PunchOutError(
          "You have already punched out.",
          "SESSION_ALREADY_PUNCHED_OUT",
        );
      }

      if (session.status !== "PUNCHED_IN") {
        throw new PunchOutError(
          "The attendance session is not in a valid state.",
          "INVALID_SESSION_STATE",
        );
      }

      /**
       * ---------------------------------------------------------
       * 6. Capture exact punch-out instant
       * ---------------------------------------------------------
       */

      const punchedOutAt = new Date();

      /**
       * ---------------------------------------------------------
       * 7. Validate session timing
       * ---------------------------------------------------------
       */

      if (punchedOutAt.getTime() < session.punchedInAt.getTime()) {
        throw new PunchOutError(
          "The punch-out time cannot be earlier than the punch-in time.",
          "INVALID_SESSION_TIMING",
        );
      }

      /**
       * ---------------------------------------------------------
       * 8. Calculate total elapsed session minutes
       *
       * This includes break time.
       * Break time is removed below.
       * ---------------------------------------------------------
       */

      const totalSessionMinutes = Math.max(
        0,
        Math.floor(
          (punchedOutAt.getTime() - session.punchedInAt.getTime()) / 60000,
        ),
      );

      /**
       * ---------------------------------------------------------
       * 9. Resolve all breaks for this session
       * ---------------------------------------------------------
       */

      const breaks = await tx.attendanceBreak.findMany({
        where: {
          sessionId: session.id,
        },

        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          durationMinutes: true,
        },
      });

      /**
       * ---------------------------------------------------------
       * 10. Make sure there is no open break
       * ---------------------------------------------------------
       */

      const openBreak = breaks.find(
        (breakRecord) => breakRecord.endedAt === null,
      );

      if (openBreak) {
        throw new PunchOutError(
          "You are currently on a break. Please end your break before punching out.",
          "ACTIVE_BREAK_EXISTS",
        );
      }

      /**
       * ---------------------------------------------------------
       * 11. Calculate total break minutes
       * ---------------------------------------------------------
       */

      const totalBreakMinutes = breaks.reduce(
        (total, breakRecord) =>
          total + Math.max(0, breakRecord.durationMinutes),
        0,
      );

      /**
       * ---------------------------------------------------------
       * 12. Calculate actual worked minutes for this session
       * ---------------------------------------------------------
       */

      const sessionWorkedMinutes = Math.max(
        0,
        totalSessionMinutes - totalBreakMinutes,
      );

      /**
       * ---------------------------------------------------------
       * 13. Enforce minimum actual working duration
       *
       * This is checked AFTER removing break time.
       * ---------------------------------------------------------
       */

      if (sessionWorkedMinutes < ATTENDANCE_CONSTANTS.minimumSessionMinutes) {
        const remainingMinutes =
          ATTENDANCE_CONSTANTS.minimumSessionMinutes - sessionWorkedMinutes;

        throw new PunchOutError(
          `You must work for at least ${ATTENDANCE_CONSTANTS.minimumSessionMinutes} minutes before punching out. Please wait ${remainingMinutes} more minute${
            remainingMinutes === 1 ? "" : "s"
          }.`,
          "MINIMUM_SESSION_TIME_NOT_MET",
        );
      }

      /**
       * ---------------------------------------------------------
       * 14. Calculate new daily attendance totals
       * ---------------------------------------------------------
       */

      const totalWorkedMinutes =
        attendance.workedMinutes + sessionWorkedMinutes;

      const regularMinutes = Math.min(
        totalWorkedMinutes,
        attendance.requiredMinutes,
      );

      const overtimeMinutes = Math.max(
        totalWorkedMinutes - attendance.requiredMinutes,
        0,
      );

      const shortfallMinutes = Math.max(
        attendance.requiredMinutes - totalWorkedMinutes,
        0,
      );

      /**
       * ---------------------------------------------------------
       * 15. Determine attendance status
       * ---------------------------------------------------------
       */

      const attendanceStatus =
        totalWorkedMinutes >= attendance.requiredMinutes ? "COMPLETE" : "SHORT";

      /**
       * ---------------------------------------------------------
       * 16. Close the attendance session
       *
       * Employee explicitly clicked Punch Out.
       * ---------------------------------------------------------
       */

      // await tx.attendanceSession.update({
      //   where: {
      //     id: sessionId,
      //   },

      //   data: {
      //     status: "PUNCHED_OUT",
      //     punchedOutAt,
      //     closedBy: "EMPLOYEE",
      //     totalSessionMinutes,
      //     totalBreakMinutes,
      //     workedMinutes: sessionWorkedMinutes,
      //   },
      // });

      await tx.attendanceSession.update({
        where: {
          id: sessionId,
        },

        data: {
          status: "PUNCHED_OUT",
          punchedOutAt,
          closedBy,
          totalSessionMinutes,
          totalBreakMinutes,
          workedMinutes: sessionWorkedMinutes,
          workSummary: validatedWorkSummary,
        },
      });

      /**
       * ---------------------------------------------------------
       * 17. Update daily attendance totals
       * ---------------------------------------------------------
       */

      await tx.attendance.update({
        where: {
          id: attendance.id,
        },

        data: {
          workedMinutes: totalWorkedMinutes,
          regularMinutes,
          overtimeMinutes,
          shortfallMinutes,
          status: attendanceStatus,
        },
      });

      /**
       * ---------------------------------------------------------
       * 18. Return client state
       * ---------------------------------------------------------
       */

      return {
        status: "PUNCHED_OUT" as const,

        attendanceId: attendance.id,

        sessionId: session.id,

        punchedInAt: session.punchedInAt.toISOString(),

        punchedOutAt: punchedOutAt.toISOString(),

        closedBy,

        workedMinutes: totalWorkedMinutes,

        requiredMinutes: attendance.requiredMinutes,

        regularMinutes,

        overtimeMinutes,

        shortfallMinutes,
      };
    });

    /**
     * ---------------------------------------------------------
     * Performance
     * ---------------------------------------------------------
     */

    const totalTime = performance.now() - startedAt;

    console.log(`[STAFFZENO] punchOut:total: ${totalTime.toFixed(2)} ms`);

    return result;
  } catch (error) {
    const totalTime = performance.now() - startedAt;

    console.error(
      `[STAFFZENO] punchOut failed after ${totalTime.toFixed(2)} ms:`,
      error,
    );

    if (error instanceof PunchOutError) {
      throw error;
    }

    throw new Error(
      "Something went wrong while punching out. Please try again.",
    );
  }
}

/**
 * -----------------------------------------------------------
 * Punch-out business error
 * -----------------------------------------------------------
 */

class PunchOutError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "PunchOutError";
  }
}
