import { z } from "zod";

import {
  timeSchema,
  nonNegativeIntegerSchema,
} from "@/validators/organization/common";

// ─────────────────────────────────────────────
// Working days
// ─────────────────────────────────────────────

export const workingDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export type WorkingDay = z.infer<typeof workingDaySchema>;

// ─────────────────────────────────────────────
// Working Saturdays
// ─────────────────────────────────────────────

export const workingSaturdaySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export type WorkingSaturday = z.infer<typeof workingSaturdaySchema>;

// ─────────────────────────────────────────────
// Update attendance settings
// ─────────────────────────────────────────────

export const updateAttendanceSettingsSchema = z
  .object({
    officeStartTime: timeSchema,

    officeEndTime: timeSchema,

    gracePeriod: nonNegativeIntegerSchema.max(
      120,
      "Grace period cannot exceed 120 minutes",
    ),

    workingDays: z
      .array(workingDaySchema)
      .min(1, "Select at least one working day")
      .refine(
        (days) => new Set(days).size === days.length,
        "Working days cannot contain duplicates",
      ),

    workingSaturdays: z
      .array(workingSaturdaySchema)
      .refine(
        (days) => new Set(days).size === days.length,
        "Working Saturdays cannot contain duplicates",
      ),
  })
  .refine((data) => data.officeStartTime < data.officeEndTime, {
    message: "Office end time must be after start time",
    path: ["officeEndTime"],
  });

export type UpdateAttendanceSettingsInput = z.infer<
  typeof updateAttendanceSettingsSchema
>;
