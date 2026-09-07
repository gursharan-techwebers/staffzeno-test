"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { actionResponse, ACTION_STATUS } from "@/lib/actionResponse";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/validators/auth/auth";
import { sendPasswordResetConfirmation } from "@/sendEmails/auth/resetPasswordEmail";
import { getFirstName } from "@/lib/utils";
import { getSession } from "../user/getSession";
import type { ActionResult } from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

type ChangePasswordSuccess = {
  message: string;
};

export async function changePassword(
  input: ChangePasswordInput,
): Promise<ActionResult<ChangePasswordSuccess>> {
  const parsed = changePasswordSchema.safeParse(input);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please fix the highlighted fields.",
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const session = await getSession();

    if (!session) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to change your password.",
        "UNAUTHORIZED",
      );
    }

    const result = await auth.api.changePassword({
      body: {
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    // Update the last password change timestamp only after
    // Better Auth successfully changes the password.
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        lastPasswordChangedAt: new Date(),
      },
    });

    await sendPasswordResetConfirmation({
      name: getFirstName(result.user.name),
      email: result.user.email,
      changedAt: new Date().toLocaleString(),
    });

    const message = "Your password has been changed successfully.";

    return actionResponse(
      ACTION_STATUS.OK,
      {
        message,
      },
      message,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ??
          "Could not change your password. Please check your current password and try again.",
        "CONFLICT",
      );
    }

    console.error("[changePassword] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
