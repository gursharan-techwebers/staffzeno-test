import { z } from "zod";

// ─────────────────────────────────────────────
// Reusable field schemas
// ─────────────────────────────────────────────

export const titleSchema = z
  .string()
  .trim()
  .min(2, "Title must be at least 2 characters long")
  .max(100, "Title must not exceed 100 characters")
  .regex(
    /^[a-zA-Z0-9\s&/().,+#'’-]+$/,
    "Title contains unsupported characters",
  );

export type titleSchemaInput = z.infer<typeof titleSchema>;

export const organizationNameSchema = z
  .string()
  .trim()
  .min(2, "Organization name must be at least 2 characters long")
  .max(50, "Organization name must not exceed 50 characters");

export const TeamNameSchema = z
  .string()
  .trim()
  .min(2, "Organization name must be at least 2 characters long")
  .max(50, "Organization name must not exceed 50 characters");
