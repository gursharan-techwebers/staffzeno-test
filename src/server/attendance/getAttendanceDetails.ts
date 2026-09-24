"use server";

import { prisma } from "@/lib/prisma";
import { getAuthContext } from "../auth/getAuthContext";

export async function getAttendanceDetails(attendanceId: string) {
  const auth = await getAuthContext();

  if (!auth?.user.id || !auth.session.activeOrganizationId) {
    throw new Error("Unauthorized");
  }

  if (!attendanceId) {
    throw new Error("Attendance ID is required");
  }

  const attendance = await prisma.attendance.findFirst({
    where: {
      id: attendanceId,
      organizationId: auth.session.activeOrganizationId,
    },

    select: {
      id: true,
      date: true,
      timezone: true,
      requiredMinutes: true,
      workedMinutes: true,
      regularMinutes: true,
      overtimeMinutes: true,
      shortfallMinutes: true,
      status: true,
      isFinalized: true,
      finalizedAt: true,

      member: {
        select: {
          title: true,

          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },

      /*
       * Attendance audits are used to determine
       * which administrator closed a session.
       */
      audits: {
        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          reason: true,
          changes: true,
          createdAt: true,

          updatedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },

      sessions: {
        orderBy: {
          sessionNumber: "asc",
        },

        select: {
          id: true,
          sessionNumber: true,
          status: true,
          punchedInAt: true,
          punchedOutAt: true,
          closedBy: true,
          totalSessionMinutes: true,
          totalBreakMinutes: true,
          workedMinutes: true,
          workSummary: true,

          breaks: {
            orderBy: {
              startedAt: "asc",
            },

            select: {
              id: true,
              startedAt: true,
              endedAt: true,
              durationMinutes: true,
            },
          },
        },
      },
    },
  });

  if (!attendance) {
    throw new Error("Attendance record not found");
  }

  /*
   * ---------------------------------------------------------
   * ADMIN ATTENDANCE UPDATE AUDITS
   * ---------------------------------------------------------
   *
   * updateAttendance.ts creates audits with:
   *
   * changes: {
   *   type: "ADMIN_ATTENDANCE_UPDATE",
   *   sessions: [
   *     {
   *       id: "actual-session-id",
   *       ...
   *     }
   *   ]
   * }
   *
   * We use those session IDs to determine which
   * administrator performed the update.
   */

  const adminCloseAudits = attendance.audits.filter(
    (audit) =>
      typeof audit.changes === "object" &&
      audit.changes !== null &&
      "type" in audit.changes &&
      audit.changes.type === "ADMIN_ATTENDANCE_UPDATE",
  );

  /*
   * ---------------------------------------------------------
   * Extract session IDs from audit changes
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * The audit does NOT contain:
   *
   *   changes.sessionId
   *
   * It contains:
   *
   *   changes.sessions[].id
   *
   * Therefore we need to read the sessions array.
   */

  const getAuditSessionIds = (changes: unknown): string[] => {
    if (!changes || typeof changes !== "object") {
      return [];
    }

    const value = changes as Record<string, unknown>;

    if (!Array.isArray(value.sessions)) {
      return [];
    }

    return value.sessions
      .map((session) => {
        if (!session || typeof session !== "object") {
          return null;
        }

        const sessionData = session as Record<string, unknown>;

        return typeof sessionData.id === "string" ? sessionData.id : null;
      })
      .filter((id): id is string => Boolean(id));
  };

  /*
   * ---------------------------------------------------------
   * Create session -> admin map
   * ---------------------------------------------------------
   *
   * Example:
   *
   * sessionId123 -> John Smith
   * sessionId456 -> Sarah Jones
   *
   * Audits are ordered newest first, so if the
   * same session appears in multiple audits,
   * the first one is the latest admin update.
   */

  const adminCloserBySessionId = new Map<
    string,
    {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    }
  >();

  for (const audit of adminCloseAudits) {
    const sessionIds = getAuditSessionIds(audit.changes);

    /*
     * One admin attendance update can contain
     * multiple sessions.
     */
    for (const sessionId of sessionIds) {
      /*
       * Because audits are ordered newest first,
       * keep the first/latest administrator.
       */
      if (adminCloserBySessionId.has(sessionId)) {
        continue;
      }

      adminCloserBySessionId.set(sessionId, {
        id: audit.updatedByUser.id,
        name: audit.updatedByUser.name,
        email: audit.updatedByUser.email,
        image: audit.updatedByUser.image,
      });
    }
  }

  /*
   * ---------------------------------------------------------
   * Return attendance details
   * ---------------------------------------------------------
   */

  return {
    id: attendance.id,

    date: attendance.date,

    timezone: attendance.timezone,

    status: attendance.status,

    requiredMinutes: attendance.requiredMinutes,

    workedMinutes: attendance.workedMinutes,

    regularMinutes: attendance.regularMinutes,

    overtimeMinutes: attendance.overtimeMinutes,

    shortfallMinutes: attendance.shortfallMinutes,

    isFinalized: attendance.isFinalized,

    finalizedAt: attendance.finalizedAt,

    employee: {
      name: attendance.member.user.name,

      title: attendance.member.title ?? "Employee",

      email: attendance.member.user.email,

      image: attendance.member.user.image ?? null,
    },

    sessions: attendance.sessions.map((session) => {
      /*
       * Only look for an admin when
       * closedBy is actually ADMIN.
       *
       * Employee/system sessions will not
       * perform an audit lookup.
       */
      const adminCloser =
        session.closedBy === "ADMIN"
          ? (adminCloserBySessionId.get(session.id) ?? null)
          : null;

      return {
        id: session.id,

        sessionNumber: session.sessionNumber,

        status: session.status,

        punchedInAt: session.punchedInAt,

        punchedOutAt: session.punchedOutAt,

        closedBy: session.closedBy,

        /*
         * Admin name is returned only when
         * the session was closed by an admin.
         */
        closedByName:
          session.closedBy === "ADMIN" ? (adminCloser?.name ?? null) : null,

        /*
         * Complete admin information.
         */
        closedByUser:
          session.closedBy === "ADMIN" && adminCloser
            ? {
                id: adminCloser.id,

                name: adminCloser.name,

                email: adminCloser.email,

                image: adminCloser.image,
              }
            : null,

        totalSessionMinutes: session.totalSessionMinutes,

        totalBreakMinutes: session.totalBreakMinutes,

        workedMinutes: session.workedMinutes,

        workSummary: session.workSummary,

        breaks: session.breaks.map((breakItem) => ({
          id: breakItem.id,

          startedAt: breakItem.startedAt,

          endedAt: breakItem.endedAt,

          durationMinutes: breakItem.durationMinutes,
        })),
      };
    }),
  };
}
