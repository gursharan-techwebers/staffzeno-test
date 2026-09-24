"use server";

import "server-only";

import { prisma } from "@/lib/prisma";
import { AttendanceSessionClosedBy } from "@/generated/prisma/enums";
import { getAttendanceCloseTime } from "./getAttendanceCloseTime";

type CloseAttendanceSessionsInput = {
  organizationIds: string[];
};

export type CloseAttendanceSessionsResult = {
  processed: number;
  closed: number;
  skipped: number;
  failed: number;
};

export async function closeAttendanceSessions({
  organizationIds,
}: CloseAttendanceSessionsInput): Promise<CloseAttendanceSessionsResult> {
  const result: CloseAttendanceSessionsResult = {
    processed: 0,
    closed: 0,
    skipped: 0,
    failed: 0,
  };

  if (organizationIds.length === 0) {
    return result;
  }

  const organizations = await prisma.organization.findMany({
    where: {
      id: {
        in: organizationIds,
      },
      attendanceSettings: {
        isNot: null,
      },
    },
    select: {
      id: true,
      attendanceSettings: {
        select: {
          timezone: true,
        },
      },
    },
  });

  for (const organization of organizations) {
    const timezone = organization.attendanceSettings?.timezone;

    if (!timezone) {
      continue;
    }

    const closeAt = await getAttendanceCloseTime(new Date(), timezone);

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        status: {
          in: ["PUNCHED_IN", "ON_BREAK"],
        },
        attendance: {
          organizationId: organization.id,
          isFinalized: false,
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        punchedInAt: "asc",
      },
    });

    result.processed += sessions.length;

    for (const session of sessions) {
      try {
        const closed = await closeAttendanceSession({
          sessionId: session.id,
          closeAt,
        });

        if (closed) {
          result.closed++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.failed++;

        console.error(
          `[STAFFZENO] Failed to automatically close attendance session ${session.id}:`,
          error,
        );
      }
    }
  }

  return result;
}

type CloseAttendanceSessionInput = {
  sessionId: string;
  closeAt: Date;
};

async function closeAttendanceSession({
  sessionId,
  closeAt,
}: CloseAttendanceSessionInput): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
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
      return false;
    }

    if (session.status === "PUNCHED_OUT") {
      return false;
    }

    if (session.status !== "PUNCHED_IN" && session.status !== "ON_BREAK") {
      return false;
    }

    const attendance = await tx.attendance.findUnique({
      where: {
        id: session.attendanceId,
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
      return false;
    }

    if (attendance.isFinalized) {
      return false;
    }

    const punchedOutAt =
      closeAt.getTime() < session.punchedInAt.getTime()
        ? session.punchedInAt
        : closeAt;

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

    for (const breakRecord of breaks) {
      if (breakRecord.endedAt !== null) {
        continue;
      }

      const breakEnd = new Date(
        Math.max(breakRecord.startedAt.getTime(), punchedOutAt.getTime()),
      );

      const durationMinutes = Math.max(
        0,
        Math.floor(
          (breakEnd.getTime() - breakRecord.startedAt.getTime()) / 60000,
        ),
      );

      await tx.attendanceBreak.update({
        where: {
          id: breakRecord.id,
        },
        data: {
          endedAt: breakEnd,
          durationMinutes,
        },
      });
    }

    const updatedBreaks = await tx.attendanceBreak.findMany({
      where: {
        sessionId: session.id,
      },
      select: {
        durationMinutes: true,
      },
    });

    const totalBreakMinutes = updatedBreaks.reduce(
      (total, breakRecord) => total + Math.max(0, breakRecord.durationMinutes),
      0,
    );

    const totalSessionMinutes = Math.max(
      0,
      Math.floor(
        (punchedOutAt.getTime() - session.punchedInAt.getTime()) / 60000,
      ),
    );

    const sessionWorkedMinutes = Math.max(
      0,
      totalSessionMinutes - totalBreakMinutes,
    );

    const totalWorkedMinutes = attendance.workedMinutes + sessionWorkedMinutes;

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

    const attendanceStatus =
      totalWorkedMinutes >= attendance.requiredMinutes ? "COMPLETE" : "SHORT";

    await tx.attendanceSession.update({
      where: {
        id: session.id,
      },
      data: {
        status: "PUNCHED_OUT",
        punchedOutAt,
        closedBy: AttendanceSessionClosedBy.SYSTEM,
        totalSessionMinutes,
        totalBreakMinutes,
        workedMinutes: sessionWorkedMinutes,

        // System automatically closed the session,
        // so there is no employee work summary.
        workSummary: null,
      },
    });

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

    return true;
  });
}
