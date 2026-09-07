"use server";

import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { getSession } from "./getSession";

export async function revokeUserSession(
  sessionId: string,
): Promise<ActionResult<null>> {
  // --------------------------------------------------
  // Authentication
  // --------------------------------------------------

  const currentSession = await getSession();

  if (!currentSession?.user) {
    return actionResponse(
      ACTION_STATUS.UNAUTHORIZED,
      "You must be logged in to revoke a session.",
      "UNAUTHORIZED",
    );
  }

  // --------------------------------------------------
  // Validate session ID
  // --------------------------------------------------

  if (!sessionId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Session ID is required.",
      "BAD_REQUEST",
    );
  }

  // --------------------------------------------------
  // Find session belonging to current user
  // --------------------------------------------------

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId: currentSession.user.id,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      token: true,
    },
  });

  if (!session) {
    return actionResponse(
      ACTION_STATUS.NOT_FOUND,
      "Session not found.",
      "NOT_FOUND",
    );
  }

  // --------------------------------------------------
  // Prevent revoking current session
  // --------------------------------------------------

  if (session.id === currentSession.session.id) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "You cannot revoke your current session.",
      "BAD_REQUEST",
    );
  }

  // --------------------------------------------------
  // Revoke session
  // --------------------------------------------------

  try {
    await auth.api.revokeSession({
      body: {
        token: session.token,
      },
      headers: await headers(),
    });

    return actionResponse(
      ACTION_STATUS.OK,
      null,
      "Session revoked successfully.",
    );
  } catch (error) {
    console.error("[revokeUserSession] Failed:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to revoke the session. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
