"use server";

import { prisma } from "@/lib/prisma";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import {
  updateAccountProfileSchema,
  type UpdateAccountProfileInput,
} from "@/validators/auth/account";

import { getAuthContext } from "../auth/getAuthContext";

export async function updateAccountProfile(
  input: UpdateAccountProfileInput,
): Promise<ActionResult<null>> {
  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  const authContext = await getAuthContext();

  if (!authContext) {
    return actionResponse(
      ACTION_STATUS.UNAUTHORIZED,
      "You must be logged in to update your profile.",
      "UNAUTHORIZED",
    );
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validation = updateAccountProfileSchema.safeParse(input);

  if (!validation.success) {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of validation.error.issues) {
      const field = issue.path[0];

      if (typeof field !== "string") {
        continue;
      }

      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }

      fieldErrors[field].push(issue.message);
    }

    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please correct the highlighted fields.",
      "VALIDATION_ERROR",
      fieldErrors,
    );
  }

  const { user } = authContext;
  const { name, phone } = validation.data;

  // ---------------------------------------------------------------------------
  // Update current user
  // ---------------------------------------------------------------------------

  try {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name,
        phone: phone.trim() === "" ? null : phone.trim(),
      },
    });

    return actionResponse(
      ACTION_STATUS.OK,
      null,
      "Profile updated successfully.",
    );
  } catch (error) {
    console.error("[updateAccountProfile] Failed to update profile:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to update your profile. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
