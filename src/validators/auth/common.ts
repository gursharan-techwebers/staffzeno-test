import { z } from "zod";

// ─────────────────────────────────────────────
// Reusable field schemas
// ─────────────────────────────────────────────

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters long")
  .max(50, "Name must not exceed 50 characters")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Name can only contain letters, spaces, hyphens, and apostrophes",
  );

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(255, "Email must not exceed 255 characters")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(64, "Password must not exceed 64 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^a-zA-Z0-9]/,
    "Password must contain at least one special character",
  );

// For login we don't want to leak password rules — just require it exists
export const loginPasswordSchema = z.string().min(1, "Password is required");

export const phoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d+$/.test(value),
    "Phone number must contain only numbers. No +, -, spaces, or other characters are allowed.",
  )
  .refine(
    (value) => value === "" || value.length >= 7,
    "Phone number must be at least 7 digits.",
  )
  .refine(
    (value) => value === "" || value.length <= 15,
    "Phone number must be at most 15 digits.",
  );
