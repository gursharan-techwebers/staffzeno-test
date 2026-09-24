import { MAX_WORK_SUMMARY_LENGTH } from "@/constants/attendance";
import { z } from "zod";

// --------------------------------------------------
// Time
// --------------------------------------------------

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time.");

// --------------------------------------------------
// Break
// --------------------------------------------------

const attendanceBreakSchema = z
  .object({
    id: z.string().optional(),

    start: timeSchema,

    end: timeSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.start || !value.end) {
      return;
    }

    if (value.end <= value.start) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "Break end time must be after the start time.",
      });
    }
  });

// --------------------------------------------------
// Work Summary
// --------------------------------------------------

function getRichTextPlainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export const workSummarySchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) return false;

      const plainText = getRichTextPlainText(value);

      return plainText.length >= 20;
    },
    {
      message: "Please provide a meaningful work summary.",
    },
  )
  .refine(
    (value) => {
      const plainText = getRichTextPlainText(value);

      return plainText.length <= MAX_WORK_SUMMARY_LENGTH;
    },
    {
      message: `Work summary cannot exceed ${MAX_WORK_SUMMARY_LENGTH} characters.`,
    },
  );

export type WorkSummaryInput = z.infer<typeof workSummarySchema>;

// --------------------------------------------------
// Session
// --------------------------------------------------

const attendanceSessionSchema = z
  .object({
    id: z.string().optional(),

    sessionNumber: z.number().int().min(1, "Invalid session number."),

    start: timeSchema,

    end: timeSchema,

    workSummary: z.string().trim().optional(),

    breaks: z.array(attendanceBreakSchema),
  })
  .superRefine((value, ctx) => {
    if (!value.start || !value.end) {
      return;
    }

    // --------------------------------------------------
    // Session must have a valid duration
    // --------------------------------------------------

    if (value.end <= value.start) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "Session end time must be after the start time.",
      });
    }

    // --------------------------------------------------
    // Completed sessions require a meaningful summary
    // --------------------------------------------------

    if (value.end) {
      const summaryValidation = workSummarySchema.safeParse(
        value.workSummary ?? "",
      );

      if (!summaryValidation.success) {
        ctx.addIssue({
          code: "custom",
          path: ["workSummary"],
          message:
            summaryValidation.error.issues[0]?.message ??
            "Please provide a meaningful work summary.",
        });
      }
    }

    // --------------------------------------------------
    // Breaks must be inside the session
    // --------------------------------------------------

    value.breaks.forEach((breakItem, index) => {
      if (!breakItem.start || !breakItem.end) {
        return;
      }

      if (breakItem.start < value.start) {
        ctx.addIssue({
          code: "custom",
          path: ["breaks", index, "start"],
          message: "Break cannot start before the session.",
        });
      }

      if (breakItem.end > value.end) {
        ctx.addIssue({
          code: "custom",
          path: ["breaks", index, "end"],
          message: "Break cannot end after the session.",
        });
      }
    });

    // --------------------------------------------------
    // Breaks cannot overlap
    // --------------------------------------------------

    const sortedBreaks = value.breaks
      .map((breakItem, index) => ({
        ...breakItem,
        originalIndex: index,
      }))
      .filter((breakItem) => breakItem.start && breakItem.end)
      .sort((a, b) => a.start.localeCompare(b.start));

    for (let index = 1; index < sortedBreaks.length; index++) {
      const previous = sortedBreaks[index - 1];
      const current = sortedBreaks[index];

      if (current.start < previous.end) {
        ctx.addIssue({
          code: "custom",
          path: ["breaks", current.originalIndex, "start"],
          message: "Break overlaps another break.",
        });
      }
    }
  });

// --------------------------------------------------
// Manage Attendance
// --------------------------------------------------

export const updateAttendanceSchema = z
  .object({
    attendanceId: z.string().min(1, "Attendance ID is required."),

    reason: z
      .string()
      .trim()
      .min(1, "Please provide a reason for this change.")
      .max(500, "Reason cannot exceed 500 characters."),

    sessions: z
      .array(attendanceSessionSchema)
      .min(1, "At least one work session is required."),
  })
  .superRefine((value, ctx) => {
    // --------------------------------------------------
    // Session numbers
    // --------------------------------------------------

    value.sessions.forEach((session, index) => {
      const expectedSessionNumber = index + 1;

      if (session.sessionNumber !== expectedSessionNumber) {
        ctx.addIssue({
          code: "custom",
          path: ["sessions", index, "sessionNumber"],
          message: `Session number must be ${expectedSessionNumber}.`,
        });
      }
    });

    // --------------------------------------------------
    // Sessions cannot overlap
    // --------------------------------------------------

    const sortedSessions = value.sessions
      .map((session, index) => ({
        ...session,
        originalIndex: index,
      }))
      .filter((session) => session.start && session.end)
      .sort((a, b) => a.start.localeCompare(b.start));

    for (let index = 1; index < sortedSessions.length; index++) {
      const previous = sortedSessions[index - 1];

      const current = sortedSessions[index];

      if (current.start < previous.end) {
        ctx.addIssue({
          code: "custom",
          path: ["sessions", current.originalIndex, "start"],
          message: "Session overlaps another work session.",
        });
      }
    }
  });

// --------------------------------------------------
// Type
// --------------------------------------------------

export type UpdateAttendanceSchemaInput = z.infer<
  typeof updateAttendanceSchema
>;
