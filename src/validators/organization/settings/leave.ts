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
    .min(15, "Short leave duration must be at least 15 minutes")
    .max(240, "Short leave duration cannot exceed 240 minutes"),

  carryForwardEnabled: z.boolean(),

  leaveEncashmentEnabled: z.boolean(),
});

export type UpdateLeaveManagementInput = z.infer<
  typeof updateLeaveManagementSchema
>;
