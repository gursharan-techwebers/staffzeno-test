"use server";

import "server-only";

import { prisma } from "@/lib/prisma";

export type AttendanceWarningSession = {
  sessionId: string;
  attendanceId: string;
  status: "PUNCHED_IN" | "ON_BREAK";
  punchedInAt: Date;
  employeeName: string;
  employeeEmail: string;
};

type GetAttendanceWarningSessionsInput = {
  organizationIds: string[];
};

export async function getAttendanceWarningSessions({
  organizationIds,
}: GetAttendanceWarningSessionsInput): Promise<AttendanceWarningSession[]> {
  if (organizationIds.length === 0) {
    return [];
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      status: {
        in: ["PUNCHED_IN", "ON_BREAK"],
      },

      warningEmailSentAt: null,

      attendance: {
        organizationId: {
          in: organizationIds,
        },

        isFinalized: false,
      },
    },

    select: {
      id: true,
      status: true,
      punchedInAt: true,

      attendance: {
        select: {
          id: true,

          member: {
            select: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },

    orderBy: {
      punchedInAt: "asc",
    },
  });

  return sessions.map((session) => ({
    sessionId: session.id,
    attendanceId: session.attendance.id,
    status: session.status as "PUNCHED_IN" | "ON_BREAK",
    punchedInAt: session.punchedInAt,
    employeeName: session.attendance.member.user.name,
    employeeEmail: session.attendance.member.user.email,
  }));
}
