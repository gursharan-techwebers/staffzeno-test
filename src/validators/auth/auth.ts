import z from "zod";
import {
  emailSchema,
  loginPasswordSchema,
  nameSchema,
  passwordSchema,
} from "./common";

// Signup
export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;

// Login
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

// Verify Email
export const verifyEmailSchema = z.object({
  email: emailSchema,
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// Forgot Password
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset Password
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const resetPasswordSchemaApi = z.object({
  password: passwordSchema,
  token: z.string().min(1, "Invalid or missing reset token."),
});

export type ResetPasswordInputApi = z.infer<typeof resetPasswordSchemaApi>;

// Change password
export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
