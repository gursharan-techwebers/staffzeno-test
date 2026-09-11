"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { getAuthContext } from "../auth/getAuthContext";

export async function revokeAllUserSessions(): Promise<ActionResult<null>> {
  const authContext = await getAuthContext();

  if (!authContext) {
    return actionResponse(
      ACTION_STATUS.UNAUTHORIZED,
      "You must be logged in to revoke sessions.",
      "UNAUTHORIZED",
    );
  }

  try {
    await auth.api.revokeSessions({
      headers: await headers(),
    });

    return actionResponse(
      ACTION_STATUS.OK,
      null,
      "All sessions have been revoked successfully.",
    );
  } catch (error) {
    console.error("[revokeAllUserSessions] Failed:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to revoke sessions. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
