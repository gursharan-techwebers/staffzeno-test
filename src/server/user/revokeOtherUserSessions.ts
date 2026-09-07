"use server";

import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { getSession } from "./getSession";

export async function revokeOtherUserSessions(): Promise<ActionResult<null>> {
  // --------------------------------------------------
  // Authentication
  // --------------------------------------------------

  const session = await getSession();

  if (!session?.user) {
    return actionResponse(
      ACTION_STATUS.UNAUTHORIZED,
      "You must be logged in to revoke sessions.",
      "UNAUTHORIZED",
    );
  }

  // --------------------------------------------------
  // Revoke all other sessions
  // --------------------------------------------------

  try {
    await auth.api.revokeOtherSessions({
      headers: await headers(),
    });

    return actionResponse(
      ACTION_STATUS.OK,
      null,
      "All other sessions have been revoked successfully.",
    );
  } catch (error) {
    console.error("[revokeOtherUserSessions] Failed:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to revoke other sessions. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
