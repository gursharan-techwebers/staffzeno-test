import { z } from "zod";

import { nonNegativeIntegerSchema } from "@/validators/organization/common";

// ─────────────────────────────────────────────
// IANA Timezone
// ─────────────────────────────────────────────
//
// Store standard IANA timezone identifiers, for example:
// - Asia/Kolkata
// - America/New_York
// - America/Chicago
// - America/Los_Angeles
// - Europe/London
//
// Do not store abbreviations such as IST, EST, PST, etc.
// ─────────────────────────────────────────────

export const timezoneSchema = z
  .string()
  .trim()
  .min(1, "Timezone is required")
  .refine((timezone) => {
    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
      }).format();

      return true;
    } catch {
      return false;
    }
  }, "Please select a valid IANA timezone");

export type Timezone = z.infer<typeof timezoneSchema>;

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
// Minimum working minutes
// ─────────────────────────────────────────────

export const minimumWorkingMinutesSchema = z
  .number()
  .int("Minimum working time must be a whole number of minutes")
  .min(1, "Minimum working time must be greater than 0")
  .max(1440, "Minimum working time cannot exceed 24 hours");

// ─────────────────────────────────────────────
// Finalization window
// ─────────────────────────────────────────────
//
// Default:
// 180 minutes = 3 hours
//
// This is intentionally kept configurable so the
// organization can change it later without a schema change.
// ─────────────────────────────────────────────

export const finalizationWindowMinutesSchema = nonNegativeIntegerSchema
  .min(1, "Finalization window must be greater than 0")
  .max(720, "Finalization window cannot exceed 12 hours");

// ─────────────────────────────────────────────
// Update attendance settings
// ─────────────────────────────────────────────

export const updateAttendanceSettingsSchema = z.object({
  timezone: timezoneSchema,

  minimumWorkingMinutes: minimumWorkingMinutesSchema,

  gracePeriod: nonNegativeIntegerSchema.max(
    120,
    "Grace period cannot exceed 120 minutes",
  ),

  finalizationWindowMinutes: finalizationWindowMinutesSchema,

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
});

export type UpdateAttendanceSettingsInput = z.infer<
  typeof updateAttendanceSettingsSchema
>;
