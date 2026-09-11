"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { getAuthContext } from "../auth/getAuthContext";

export async function revokeUserSession(
  sessionId: string,
): Promise<ActionResult<null>> {
  const normalizedSessionId = sessionId?.trim();

  if (!normalizedSessionId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Session ID is required.",
      "BAD_REQUEST",
    );
  }

  const authContext = await getAuthContext();

  if (!authContext) {
    return actionResponse(
      ACTION_STATUS.UNAUTHORIZED,
      "You must be logged in to revoke a session.",
      "UNAUTHORIZED",
    );
  }

  const { session: currentSession, user } = authContext;

  const session = await prisma.session.findFirst({
    where: {
      id: normalizedSessionId,
      userId: user.id,
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

  if (session.id === currentSession.id) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "You cannot revoke your current session.",
      "BAD_REQUEST",
    );
  }

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