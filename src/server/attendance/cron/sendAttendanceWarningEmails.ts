"use server";

import "server-only";

import { prisma } from "@/lib/prisma";
import type { AttendanceWarningSession } from "./getAttendanceWarningSessions";
import { sendAttendanceWarningEmail } from "@/sendEmails/cron/sendAttendanceWarningEmail";

export async function sendAttendanceWarningEmails(
  sessions: AttendanceWarningSession[],
) {
  const results = {
    sent: 0,
    failed: 0,
  };

  for (const session of sessions) {
    try {
      await sendAttendanceWarningEmail({
        email: session.employeeEmail,
        name: session.employeeName,
        punchedInAt: session.punchedInAt,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/org/${session.organizationSlug}/attendance`,
      });

      await prisma.attendanceSession.updateMany({
        where: {
          id: session.sessionId,
          warningEmailSentAt: null,
        },
        data: {
          warningEmailSentAt: new Date(),
        },
      });

      results.sent++;
    } catch (error) {
      console.error(
        `Failed to send attendance warning for session ${session.sessionId}:`,
        error,
      );

      results.failed++;
    }
  }

  return results;
}
