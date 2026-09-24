"use server";

import "server-only";

import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";

import {
  AttendanceSessionClosedBy,
  AttendanceSessionStatus,
  AttendanceStatus,
} from "@/generated/prisma/enums";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { getAuthContext } from "@/server/auth/getAuthContext";

import {
  updateAttendanceSchema,
  type UpdateAttendanceSchemaInput,
} from "@/validators/organization/attendance/attendance";

import { UpdateAttendanceSuccess } from "@/types/organization/attendance";

import { env } from "@/env";

import { sendAttendanceUpdatedEmail } from "@/sendEmails/organization/sendAttendanceUpdatedEmail";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getMinutes(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
}

function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

/**
 * Get the YYYY-MM-DD calendar date in a specific timezone.
 */
function getDatePartsInTimeZone(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const year = parts.find((part) => part.type === "year")?.value ?? "";

  const month = parts.find((part) => part.type === "month")?.value ?? "";

  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return {
    year,
    month,
    day,
  };
}

/**
 * Returns the timezone offset in milliseconds for a given
 * instant in the requested IANA timezone.
 */
function getTimeZoneOffset(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const asUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUTC - date.getTime();
}

/**
 * Converts an attendance date + HH:mm entered in the
 * attendance timezone into a real UTC Date.
 */
function timeInAttendanceTimeZoneToDate(
  attendanceDate: Date,
  time: string,
  timeZone: string,
): Date {
  const { year, month, day } = getDatePartsInTimeZone(attendanceDate, timeZone);

  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error("Invalid attendance time.");
  }

  /*
   * Start with the requested local time interpreted as UTC.
   * We then subtract the actual timezone offset.
   */
  const naiveUTC = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      hours,
      minutes,
      0,
      0,
    ),
  );

  const offset = getTimeZoneOffset(naiveUTC, timeZone);

  return new Date(naiveUTC.getTime() - offset);
}

function calculateStatus(
  workedMinutes: number,
  requiredMinutes: number,
): AttendanceStatus {
  if (workedMinutes >= requiredMinutes) {
    return AttendanceStatus.COMPLETE;
  }

  if (workedMinutes > 0) {
    return AttendanceStatus.SHORT;
  }

  return AttendanceStatus.ABSENT;
}

function formatAttendanceDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatAttendanceTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

// --------------------------------------------------
// Server Action
// --------------------------------------------------

export async function updateAttendance(
  input: UpdateAttendanceSchemaInput,
): Promise<ActionResult<UpdateAttendanceSuccess>> {
  /*
   * ---------------------------------------------------------
   * 1. SERVER-SIDE ZOD VALIDATION
   * ---------------------------------------------------------
   */

  const parsed = updateAttendanceSchema.safeParse(input);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please fix the highlighted attendance fields.",
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const data = parsed.data;

  try {
    /*
     * ---------------------------------------------------------
     * 2. AUTHENTICATION
     * ---------------------------------------------------------
     */

    const auth = await getAuthContext();

    if (!auth?.user?.id) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be signed in to update attendance.",
        "UNAUTHORIZED",
      );
    }

    const organizationId = auth.session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "No active organization was found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },

      select: {
        name: true,
        slug: true,
      },
    });

    if (!organization) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Organization not found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    const updatedByUserId = auth.user.id;

    /*
     * ---------------------------------------------------------
     * 3. TRANSACTION
     * ---------------------------------------------------------
     */

    const attendance = await prisma.$transaction(async (tx) => {
      /*
       * ---------------------------------------------------
       * Load attendance
       * ---------------------------------------------------
       */

      const existingAttendance = await tx.attendance.findFirst({
        where: {
          id: data.attendanceId,
          organizationId,
        },

        select: {
          id: true,
          memberId: true,

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
              role: true,
              userId: true,
            },
          },

          sessions: {
            orderBy: {
              sessionNumber: "asc",
            },

            select: {
              id: true,
              sessionNumber: true,
            },
          },
        },
      });

      if (!existingAttendance) {
        throw new Error("Attendance record not found.");
      }

      /*
       * ---------------------------------------------------
       * Authorization
       * ---------------------------------------------------
       */

      const currentUserMembership = await tx.member.findFirst({
        where: {
          organizationId,
          userId: updatedByUserId,
        },

        select: {
          role: true,
        },
      });

      if (!currentUserMembership) {
        throw new Error("You are not a member of this organization.");
      }

      const currentUserRole = currentUserMembership.role;

      const isOwner = currentUserRole === "owner";

      const isAdmin = currentUserRole === "admin";

      /*
       * Only owner/admin can modify attendance.
       */

      if (!isOwner && !isAdmin) {
        throw new Error("You do not have permission to update attendance.");
      }

      /*
       * Admins can only modify normal members.
       */

      if (isAdmin && existingAttendance.member.role !== "member") {
        throw new Error(
          "Admins can only update attendance for normal members.",
        );
      }

      /*
       * ---------------------------------------------------
       * Convert submitted times
       * ---------------------------------------------------
       */

      const normalizedSessions = data.sessions
        .map((session) => {
          const punchedInAt = timeInAttendanceTimeZoneToDate(
            existingAttendance.date,
            session.start,
            existingAttendance.timezone,
          );

          const punchedOutAt = timeInAttendanceTimeZoneToDate(
            existingAttendance.date,
            session.end,
            existingAttendance.timezone,
          );

          return {
            ...session,

            punchedInAt,

            punchedOutAt,

            breaks: session.breaks.map((breakItem) => ({
              ...breakItem,

              startedAt: timeInAttendanceTimeZoneToDate(
                existingAttendance.date,
                breakItem.start,
                existingAttendance.timezone,
              ),

              endedAt: timeInAttendanceTimeZoneToDate(
                existingAttendance.date,
                breakItem.end,
                existingAttendance.timezone,
              ),
            })),
          };
        })
        .sort((a, b) => a.sessionNumber - b.sessionNumber);

      /*
       * ---------------------------------------------------
       * Validate sessions + calculate totals
       * ---------------------------------------------------
       */

      const sessionRanges: {
        sessionNumber: number;
        punchedInAt: Date;
        punchedOutAt: Date;
      }[] = [];

      let totalWorkedMinutes = 0;

      /*
       * IMPORTANT:
       *
       * This contains the ACTUAL database session IDs
       * that were updated/created during this transaction.
       *
       * We use these IDs in the audit record so that
       * getAttendanceDetails() can correctly determine
       * which admin closed which session.
       */
      const updatedSessionAuditData: {
        id: string;
        sessionNumber: number;
        start: string;
        end: string;
        closedBy: "ADMIN";
        breaks: {
          id: string | null;
          start: string;
          end: string;
        }[];
      }[] = [];

      for (const session of normalizedSessions) {
        if (session.punchedInAt >= session.punchedOutAt) {
          throw new Error(
            `Session ${session.sessionNumber} must start before it ends.`,
          );
        }

        /*
         * Sessions cannot overlap.
         */

        for (const existing of sessionRanges) {
          if (
            rangesOverlap(
              session.punchedInAt,
              session.punchedOutAt,
              existing.punchedInAt,
              existing.punchedOutAt,
            )
          ) {
            throw new Error(
              `Session ${session.sessionNumber} overlaps another session.`,
            );
          }
        }

        /*
         * -------------------------------------------------
         * Validate breaks
         * -------------------------------------------------
         */

        const sortedBreaks = [...session.breaks].sort(
          (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
        );

        const breakRanges: {
          startedAt: Date;
          endedAt: Date;
        }[] = [];

        let totalBreakMinutes = 0;

        for (const breakItem of sortedBreaks) {
          /*
           * Break must have a valid range.
           */

          if (breakItem.startedAt >= breakItem.endedAt) {
            throw new Error(
              `Break in session ${session.sessionNumber} must start before it ends.`,
            );
          }

          /*
           * Break must be completely inside
           * its parent session.
           */

          if (
            breakItem.startedAt < session.punchedInAt ||
            breakItem.endedAt > session.punchedOutAt
          ) {
            throw new Error(
              `Break in session ${session.sessionNumber} must be within the session.`,
            );
          }

          /*
           * Breaks cannot overlap.
           */

          for (const existingBreak of breakRanges) {
            if (
              rangesOverlap(
                breakItem.startedAt,
                breakItem.endedAt,
                existingBreak.startedAt,
                existingBreak.endedAt,
              )
            ) {
              throw new Error(
                `Breaks in session ${session.sessionNumber} cannot overlap.`,
              );
            }
          }

          const durationMinutes = getMinutes(
            breakItem.startedAt,
            breakItem.endedAt,
          );

          totalBreakMinutes += durationMinutes;

          breakRanges.push({
            startedAt: breakItem.startedAt,

            endedAt: breakItem.endedAt,
          });
        }

        /*
         * -------------------------------------------------
         * Calculate worked time
         * -------------------------------------------------
         */

        const totalSessionMinutes = getMinutes(
          session.punchedInAt,
          session.punchedOutAt,
        );

        const workedMinutes = Math.max(
          0,
          totalSessionMinutes - totalBreakMinutes,
        );

        totalWorkedMinutes += workedMinutes;

        sessionRanges.push({
          sessionNumber: session.sessionNumber,

          punchedInAt: session.punchedInAt,

          punchedOutAt: session.punchedOutAt,
        });
      }

      /*
       * ---------------------------------------------------
       * Attendance totals
       * ---------------------------------------------------
       */

      const regularMinutes = Math.min(
        totalWorkedMinutes,
        existingAttendance.requiredMinutes,
      );

      const overtimeMinutes = Math.max(
        totalWorkedMinutes - existingAttendance.requiredMinutes,
        0,
      );

      const shortfallMinutes = Math.max(
        existingAttendance.requiredMinutes - totalWorkedMinutes,
        0,
      );

      const status = calculateStatus(
        totalWorkedMinutes,
        existingAttendance.requiredMinutes,
      );

      /*
       * ---------------------------------------------------
       * Existing IDs
       * ---------------------------------------------------
       */

      const existingSessionIds = new Set(
        existingAttendance.sessions.map((session) => session.id),
      );

      const submittedSessionIds = new Set(
        normalizedSessions
          .map((session) => session.id)
          .filter((id): id is string => Boolean(id)),
      );

      /*
       * Make sure every submitted existing
       * session belongs to this attendance.
       */

      for (const sessionId of submittedSessionIds) {
        if (!existingSessionIds.has(sessionId)) {
          throw new Error("Invalid session.");
        }
      }

      /*
       * ---------------------------------------------------
       * Remove sessions that no longer exist
       * ---------------------------------------------------
       *
       * Cascade deletes their breaks.
       */

      const sessionsToDelete = [...existingSessionIds].filter(
        (id) => !submittedSessionIds.has(id),
      );

      if (sessionsToDelete.length > 0) {
        await tx.attendanceSession.deleteMany({
          where: {
            attendanceId: existingAttendance.id,

            id: {
              in: sessionsToDelete,
            },
          },
        });
      }

      /*
       * ---------------------------------------------------
       * Update / create sessions
       * ---------------------------------------------------
       */

      for (const session of normalizedSessions) {
        const totalSessionMinutes = getMinutes(
          session.punchedInAt,
          session.punchedOutAt,
        );

        const totalBreakMinutes = session.breaks.reduce(
          (total, breakItem) =>
            total + getMinutes(breakItem.startedAt, breakItem.endedAt),
          0,
        );

        const workedMinutes = Math.max(
          0,
          totalSessionMinutes - totalBreakMinutes,
        );

        /*
         * Keep the submitted existing ID.
         * For a new session generate a real database ID.
         */
        let sessionId = session.id;

        if (sessionId) {
          /*
           * Existing session.
           */

          await tx.attendanceSession.update({
            where: {
              id: sessionId,
            },

            data: {
              sessionNumber: session.sessionNumber,

              punchedInAt: session.punchedInAt,

              punchedOutAt: session.punchedOutAt,

              status: AttendanceSessionStatus.PUNCHED_OUT,

              closedBy: AttendanceSessionClosedBy.ADMIN,

              totalSessionMinutes,

              totalBreakMinutes,

              workedMinutes,

              workSummary: session.workSummary?.trim() || null,
            },
          });

          /*
           * Rebuild breaks.
           */

          await tx.attendanceBreak.deleteMany({
            where: {
              sessionId,
            },
          });
        } else {
          /*
           * New session.
           */

          sessionId = randomUUID();

          await tx.attendanceSession.create({
            data: {
              id: sessionId,

              attendanceId: existingAttendance.id,

              sessionNumber: session.sessionNumber,

              status: AttendanceSessionStatus.PUNCHED_OUT,

              punchedInAt: session.punchedInAt,

              punchedOutAt: session.punchedOutAt,

              closedBy: AttendanceSessionClosedBy.ADMIN,

              totalSessionMinutes,

              totalBreakMinutes,

              workedMinutes,

              workSummary: session.workSummary?.trim() || null,
            },
          });
        }

        /*
         * Create breaks.
         */

        if (session.breaks.length > 0) {
          await tx.attendanceBreak.createMany({
            data: session.breaks.map((breakItem) => ({
              id: randomUUID(),

              sessionId: sessionId!,

              startedAt: breakItem.startedAt,

              endedAt: breakItem.endedAt,

              durationMinutes: getMinutes(
                breakItem.startedAt,
                breakItem.endedAt,
              ),
            })),
          });
        }

        /*
         * -------------------------------------------------
         * IMPORTANT:
         *
         * Store the ACTUAL sessionId generated above.
         *
         * Previously this was using:
         *
         *   session.id ?? null
         *
         * which caused newly created sessions to have
         * a null ID inside the audit record.
         *
         * That prevented getAttendanceDetails() from
         * finding which admin closed the session.
         * -------------------------------------------------
         */

        updatedSessionAuditData.push({
          id: sessionId!,

          sessionNumber: session.sessionNumber,

          start: session.start,

          end: session.end,

          closedBy: "ADMIN",

          breaks: session.breaks.map((breakItem) => ({
            id: breakItem.id ?? null,

            start: breakItem.start,

            end: breakItem.end,
          })),
        });
      }

      /*
       * ---------------------------------------------------
       * Update attendance totals
       * ---------------------------------------------------
       */

      await tx.attendance.update({
        where: {
          id: existingAttendance.id,
        },

        data: {
          workedMinutes: totalWorkedMinutes,

          regularMinutes,

          overtimeMinutes,

          shortfallMinutes,

          status,
        },
      });

      /*
       * ---------------------------------------------------
       * Audit
       * ---------------------------------------------------
       *
       * Store the actual database session IDs and
       * the user who performed this update.
       */

      await tx.attendanceAudit.create({
        data: {
          id: randomUUID(),

          attendanceId: existingAttendance.id,

          updatedByUserId,

          reason: data.reason.trim(),

          changes: {
            type: "ADMIN_ATTENDANCE_UPDATE",

            sessions: updatedSessionAuditData,

            totals: {
              workedMinutes: totalWorkedMinutes,

              regularMinutes,

              overtimeMinutes,

              shortfallMinutes,

              status,
            },
          },
        },
      });

      /*
       * ---------------------------------------------------
       * Return COMPLETE fresh attendance
       * ---------------------------------------------------
       */

      const updated = await tx.attendance.findUnique({
        where: {
          id: existingAttendance.id,
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

      if (!updated) {
        throw new Error("Attendance was updated but could not be loaded.");
      }

      return updated;
    });

    /*
     * ---------------------------------------------------------
     * SEND ATTENDANCE UPDATE EMAIL
     * ---------------------------------------------------------
     */

    try {
      await sendAttendanceUpdatedEmail({
        email: attendance.member.user.email,

        name: attendance.member.user.name,

        organizationName: organization.name,

        attendanceDate: formatAttendanceDate(
          attendance.date,
          attendance.timezone,
        ),

        updatedByName: auth.user.name,

        reason: data.reason.trim(),

        sessions: attendance.sessions.map((session) => ({
          sessionNumber: session.sessionNumber,

          startTime: formatAttendanceTime(
            session.punchedInAt,
            attendance.timezone,
          ),

          endTime: session.punchedOutAt
            ? formatAttendanceTime(session.punchedOutAt, attendance.timezone)
            : "Not recorded",

          breaks: session.breaks
            .filter((breakItem) => breakItem.endedAt !== null)
            .map((breakItem) => ({
              startTime: formatAttendanceTime(
                breakItem.startedAt,
                attendance.timezone,
              ),

              endTime: formatAttendanceTime(
                breakItem.endedAt!,
                attendance.timezone,
              ),
            })),
        })),

        url: `${env.NEXT_PUBLIC_APP_URL}/org/${organization.slug}/attendance`,
      });
    } catch (emailError) {
      /*
       * Email failure should NOT make the
       * attendance update fail.
       */

      console.error(
        "[updateAttendance] Failed to send attendance update email:",
        emailError,
      );
    }

    /*
     * ---------------------------------------------------------
     * SUCCESS
     * ---------------------------------------------------------
     */

    return actionResponse(
      ACTION_STATUS.OK,
      {
        attendance,
      },
      "Attendance updated successfully.",
    );
  } catch (error) {
    /*
     * ---------------------------------------------------------
     * Expected application errors
     * ---------------------------------------------------------
     */

    if (error instanceof Error) {
      const expectedMessages = [
        "Attendance record not found.",
        "You are not a member of this organization.",
        "You do not have permission to update attendance.",
        "Admins can only update attendance for normal members.",
        "Invalid session.",
        "Attendance was updated but could not be loaded.",
      ];

      const isExpectedError =
        expectedMessages.includes(error.message) ||
        error.message.startsWith("Session ") ||
        error.message.startsWith("Break ") ||
        error.message.startsWith("Breaks ") ||
        error.message.startsWith("Invalid ");

      if (isExpectedError) {
        return actionResponse(
          ACTION_STATUS.BAD_REQUEST,
          error.message,
          "ATTENDANCE_UPDATE_ERROR",
        );
      }
    }

    console.error("[updateAttendance] Unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong while updating attendance. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
