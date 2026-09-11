"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

export async function logoutUser(): Promise<ActionResult<undefined>> {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });

    return actionResponse(
      ACTION_STATUS.OK,
      undefined,
      "Logout successful.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to logout.",
        "BAD_REQUEST",
      );
    }

    console.error("[logoutUser] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
