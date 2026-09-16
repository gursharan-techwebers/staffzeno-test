import { z } from "zod";

import { ACTIVE_LEAVE_TYPES } from "@/constants/leave";

const leaveTypeIds = ACTIVE_LEAVE_TYPES.map((type) => type.id) as [
  string,
  ...string[],
];

const dateSchema = z
  .string()
  .min(1, "Date is required.")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date.");

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time.");

export const leaveSchema = z
  .object({
    leaveType: z.enum(leaveTypeIds, {
      error: "Please select a leave type.",
    }),

    /**
     * Start date is used by:
     * - Full Day
     * - Multiple Days
     * - Half Day
     * - Short Leave
     */
    startDate: dateSchema,

    /**
     * End date is only used by Multiple Days.
     *
     * Optional because:
     * - Full Day = one date
     * - Half Day = one date
     * - Short Leave = one date
     */
    endDate: z.string().optional(),

    duration: z.enum(["FULL_DAY", "MULTIPLE_DAYS", "HALF_DAY", "SHORT_LEAVE"], {
      error: "Please select a leave duration.",
    }),

    halfDayPeriod: z
      .enum(["FIRST_HALF", "SECOND_HALF"], {
        error: "Please select a half-day period.",
      })
      .optional(),

    startTime: z.string().optional(),

    endTime: z.string().optional(),

    reason: z
      .string()
      .trim()
      .min(1, "Reason is required.")
      .max(1000, "Reason cannot exceed 1000 characters."),
  })
  .superRefine((data, ctx) => {
    const startDate = new Date(`${data.startDate}T00:00:00`);

    const validStartDate = !Number.isNaN(startDate.getTime());

    /**
     * Validate start date
     */
    if (!validStartDate) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Invalid start date.",
      });
    }

    /**
     * Parse end date only when supplied.
     */
    let endDate: Date | null = null;
    let validEndDate = false;

    if (data.endDate) {
      endDate = new Date(`${data.endDate}T00:00:00`);
      validEndDate = !Number.isNaN(endDate.getTime());

      if (!validEndDate) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "Invalid end date.",
        });
      }
    }

    // ---------------------------------------------
    // Full Day
    // ---------------------------------------------

    if (data.duration === "FULL_DAY") {
      /**
       * Full day is exactly one date.
       * End date must not be supplied.
       */
      if (data.endDate) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date is not applicable for a full-day leave.",
        });
      }

      if (data.halfDayPeriod) {
        ctx.addIssue({
          code: "custom",
          path: ["halfDayPeriod"],
          message: "Half-day period is not applicable.",
        });
      }

      if (data.startTime) {
        ctx.addIssue({
          code: "custom",
          path: ["startTime"],
          message: "Start time is not applicable.",
        });
      }

      if (data.endTime) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "End time is not applicable.",
        });
      }

      return;
    }

    // ---------------------------------------------
    // Multiple Days
    // ---------------------------------------------

    if (data.duration === "MULTIPLE_DAYS") {
      /**
       * Multiple days requires an end date.
       */
      if (!data.endDate) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date is required for multiple-day leave.",
        });
      }

      /**
       * End date cannot be before start date.
       */
      if (validStartDate && validEndDate && endDate && endDate < startDate) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date cannot be before start date.",
        });
      }

      if (data.halfDayPeriod) {
        ctx.addIssue({
          code: "custom",
          path: ["halfDayPeriod"],
          message: "Half-day period is not applicable.",
        });
      }

      if (data.startTime) {
        ctx.addIssue({
          code: "custom",
          path: ["startTime"],
          message: "Start time is not applicable.",
        });
      }

      if (data.endTime) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "End time is not applicable.",
        });
      }

      return;
    }

    // ---------------------------------------------
    // Half Day
    // ---------------------------------------------

    if (data.duration === "HALF_DAY") {
      /**
       * Half day uses only the start date.
       */
      if (data.endDate) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date is not applicable for a half-day leave.",
        });
      }

      if (!data.halfDayPeriod) {
        ctx.addIssue({
          code: "custom",
          path: ["halfDayPeriod"],
          message: "Please select a half-day period.",
        });
      }

      if (data.startTime) {
        ctx.addIssue({
          code: "custom",
          path: ["startTime"],
          message: "Start time is not applicable.",
        });
      }

      if (data.endTime) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "End time is not applicable.",
        });
      }

      return;
    }

    // ---------------------------------------------
    // Short Leave
    // ---------------------------------------------

    if (data.duration === "SHORT_LEAVE") {
      /**
       * Short leave uses only the start date.
       */
      if (data.endDate) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date is not applicable for a short leave.",
        });
      }

      if (data.halfDayPeriod) {
        ctx.addIssue({
          code: "custom",
          path: ["halfDayPeriod"],
          message: "Half-day period is not applicable.",
        });
      }

      if (!data.startTime) {
        ctx.addIssue({
          code: "custom",
          path: ["startTime"],
          message: "Start time is required.",
        });
      } else if (!timeSchema.safeParse(data.startTime).success) {
        ctx.addIssue({
          code: "custom",
          path: ["startTime"],
          message: "Invalid start time.",
        });
      }

      if (!data.endTime) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "End time is required.",
        });
      } else if (!timeSchema.safeParse(data.endTime).success) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "Invalid end time.",
        });
      }

      if (
        data.startTime &&
        data.endTime &&
        timeSchema.safeParse(data.startTime).success &&
        timeSchema.safeParse(data.endTime).success
      ) {
        const [startHour, startMinute] = data.startTime.split(":").map(Number);

        const [endHour, endMinute] = data.endTime.split(":").map(Number);

        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        if (endMinutes <= startMinutes) {
          ctx.addIssue({
            code: "custom",
            path: ["endTime"],
            message: "End time must be after start time.",
          });
        }
      }
    }
  });

export type LeaveInput = z.infer<typeof leaveSchema>;
