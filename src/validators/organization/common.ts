import { z } from "zod";

// ─────────────────────────────────────────────
// Text
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

export type TitleSchemaInput = z.infer<typeof titleSchema>;

// ─────────────────────────────────────────────
// Organization
// ─────────────────────────────────────────────

export const organizationNameSchema = z
  .string()
  .trim()
  .min(2, "Organization name must be at least 2 characters long")
  .max(50, "Organization name must not exceed 50 characters");

export type OrganizationNameInput = z.infer<typeof organizationNameSchema>;

// ─────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────

export const teamNameSchema = z
  .string()
  .trim()
  .min(2, "Team name must be at least 2 characters long")
  .max(50, "Team name must not exceed 50 characters");

export type TeamNameInput = z.infer<typeof teamNameSchema>;

// ─────────────────────────────────────────────
// Person / Member
// ─────────────────────────────────────────────

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters long")
  .max(100, "Name must not exceed 100 characters");

export type NameInput = z.infer<typeof nameSchema>;

// ─────────────────────────────────────────────
// Email
// ─────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .max(255, "Email must not exceed 255 characters")
  .transform((value) => value.toLowerCase());

export type EmailInput = z.infer<typeof emailSchema>;

// ─────────────────────────────────────────────
// Phone
// ─────────────────────────────────────────────

export const phoneSchema = z
  .string()
  .trim()
  .max(30, "Phone number must not exceed 30 characters")
  .regex(/^[0-9+\-().\s]+$/, "Please enter a valid phone number");

export const optionalPhoneSchema = phoneSchema.optional().or(z.literal(""));

export type PhoneInput = z.infer<typeof phoneSchema>;

// ─────────────────────────────────────────────
// Address
// ─────────────────────────────────────────────

export const addressSchema = z
  .string()
  .trim()
  .min(2, "Address must be at least 2 characters long")
  .max(255, "Address must not exceed 255 characters");

export const optionalAddressSchema = addressSchema.optional().or(z.literal(""));

export type AddressInput = z.infer<typeof addressSchema>;

// ─────────────────────────────────────────────
// Description
// ─────────────────────────────────────────────

export const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must not exceed 500 characters");

export const optionalDescriptionSchema = descriptionSchema
  .optional()
  .or(z.literal(""));

export type DescriptionInput = z.infer<typeof descriptionSchema>;

// ─────────────────────────────────────────────
// Date
// ─────────────────────────────────────────────

export const dateSchema = z.date({
  message: "Please provide a valid date",
});

export type DateInput = z.infer<typeof dateSchema>;

// ─────────────────────────────────────────────
// Time
// Format: HH:mm
// ─────────────────────────────────────────────

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Please enter a valid time");

export type TimeInput = z.infer<typeof timeSchema>;

// ─────────────────────────────────────────────
// Positive integer
// ─────────────────────────────────────────────

export const positiveIntegerSchema = z
  .number()
  .int("Must be a whole number")
  .min(0, "Cannot be negative");

export type PositiveIntegerInput = z.infer<typeof positiveIntegerSchema>;

// ─────────────────────────────────────────────
// Non-negative integer
// ─────────────────────────────────────────────

export const nonNegativeIntegerSchema = z
  .number()
  .int("Must be a whole number")
  .nonnegative("Cannot be negative");

export type NonNegativeIntegerInput = z.infer<typeof nonNegativeIntegerSchema>;

// ─────────────────────────────────────────────
// URL
// ─────────────────────────────────────────────

export const urlSchema = z
  .string()
  .trim()
  .url("Please enter a valid URL")
  .max(2048, "URL is too long");

export type UrlInput = z.infer<typeof urlSchema>;

// ─────────────────────────────────────────────
// Boolean
// ─────────────────────────────────────────────

export const booleanSchema = z.boolean();

// ─────────────────────────────────────────────
// ID
// ─────────────────────────────────────────────

export const idSchema = z.string().trim().min(1, "ID is required");

export type IdInput = z.infer<typeof idSchema>;
