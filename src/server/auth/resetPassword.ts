"use server";

import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import {
  resetPasswordSchemaApi,
  type ResetPasswordInputApi,
} from "@/validators/auth/auth";

export async function resetPassword(
  input: ResetPasswordInputApi,
): Promise<ActionResult<null>> {
  const parsed = resetPasswordSchemaApi.safeParse(input);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please fix the highlighted fields.",
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { token, password } = parsed.data;

  try {
    await auth.api.resetPassword({
      body: {
        newPassword: password,
        token,
      },
    });

    return actionResponse(
      ACTION_STATUS.OK,
      null,
      "Your password has been reset successfully.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ??
          "Could not reset your password. The link may have expired.",
        "BAD_REQUEST",
      );
    }

    console.error("[resetPassword] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
