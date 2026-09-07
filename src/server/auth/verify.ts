"use server";

import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { emailSchema } from "@/validators/auth/common";

export async function verifyEmail(email: string): Promise<ActionResult<null>> {
  const parsed = emailSchema.safeParse(email);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please enter a valid email address.",
      "VALIDATION_ERROR",
    );
  }

  try {
    await auth.api.sendVerificationEmail({
      body: {
        email: parsed.data,
      },
    });

    return actionResponse(
      ACTION_STATUS.OK,
      null,
      "Check your inbox to verify your email.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Could not send the verification email.",
        "BAD_REQUEST",
      );
    }

    console.error("[verifyEmail] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
