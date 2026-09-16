import { z } from "zod";

import { nonNegativeIntegerSchema } from "@/validators/organization/common";

// ─────────────────────────────────────────────
// Update leave management settings
// ─────────────────────────────────────────────

export const updateLeaveManagementSchema = z.object({
  monthlyPaidLeaves: nonNegativeIntegerSchema.max(
    31,
    "Monthly paid leaves cannot exceed 31",
  ),

  monthlyPaidHalfDayLeaves: nonNegativeIntegerSchema.max(
    31,
    "Monthly paid half-day leaves cannot exceed 31",
  ),

  monthlyPaidShortLeaves: nonNegativeIntegerSchema.max(
    31,
    "Monthly paid short leaves cannot exceed 31",
  ),

  shortLeaveDuration: z
    .number()
    .int("Short leave duration must be a whole number")
    .min(0, "Short leave duration must be at least 0 minutes")
    .max(120, "Short leave duration cannot exceed 120 minutes"),

  carryForwardEnabled: z.boolean(),

  leaveEncashmentEnabled: z.boolean(),
});

export type UpdateLeaveManagementInput = z.infer<
  typeof updateLeaveManagementSchema
>;
