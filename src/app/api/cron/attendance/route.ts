import { NextResponse } from "next/server";

import { closeAttendanceSessions } from "@/server/attendance/cron/closeAttendanceSessions";
import { getAttendanceCronAction } from "@/server/attendance/cron/getAttendanceCronAction";
import { getAttendanceCronOrganizations } from "@/server/attendance/cron/getAttendanceCronOrganizations";
import { getAttendanceWarningSessions } from "@/server/attendance/cron/getAttendanceWarningSessions";
import { sendAttendanceWarningEmails } from "@/server/attendance/cron/sendAttendanceWarningEmails";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const now = new Date();

    const organizations = await getAttendanceCronOrganizations();

    const warningOrganizations: string[] = [];
    const closeOrganizations: string[] = [];

    for (const organization of organizations) {
      const timezone = organization.attendanceSettings?.timezone;

      if (!timezone) {
        continue;
      }

      const action = getAttendanceCronAction(now, timezone);

      if (action === "WARNING") {
        warningOrganizations.push(organization.id);
        continue;
      }

      if (action === "CLOSE") {
        closeOrganizations.push(organization.id);
      }
    }

    /*
     * WARNING
     *
     * Find active sessions that have not received
     * the warning email yet.
     */
    const warningSessions = await getAttendanceWarningSessions({
      organizationIds: warningOrganizations,
    });

    const warningResult = await sendAttendanceWarningEmails(warningSessions);

    /*
     * CLOSE
     *
     * Automatically close all remaining active sessions
     * for organizations currently in the close window.
     */
    const closeResult = await closeAttendanceSessions({
      organizationIds: closeOrganizations,
    });

    return NextResponse.json({
      success: true,
      warningOrganizations,
      closeOrganizations,
      warningSessions: warningSessions.length,
      warningResult,
      closeResult,
    });
  } catch (error) {
    console.error("Attendance cron failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Attendance cron failed.",
      },
      {
        status: 500,
      },
    );
  }
}
