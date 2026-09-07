"use server";

import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { emailSchema } from "@/validators/auth/common";

export async function requestPasswordReset(
  email: string,
): Promise<ActionResult<undefined>> {
  const parsed = emailSchema.safeParse(email);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please enter a valid email address.",
      "VALIDATION_ERROR",
    );
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: parsed.data,
        redirectTo: `${process.env.BETTER_AUTH_URL}/reset-password`,
      },
    });

    return actionResponse(
      ACTION_STATUS.OK,
      undefined,
      "If an account exists, we've sent a password reset link to your email.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Could not send the password reset email.",
        "BAD_REQUEST",
      );
    }

    console.error("[requestPasswordReset] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
