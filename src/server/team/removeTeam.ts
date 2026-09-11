"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getAuthContext } from "../auth/getAuthContext";

export async function removeTeam(teamId: string): Promise<ActionResult<null>> {
  // --------------------------------------------------
  // 1. Validate input
  // --------------------------------------------------

  const normalizedTeamId = teamId?.trim();

  if (!normalizedTeamId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Team ID is required.",
      "BAD_REQUEST",
    );
  }

  try {
    // --------------------------------------------------
    // 2. Get authenticated user
    // --------------------------------------------------

    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to remove a team.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // --------------------------------------------------
    // 3. Get active organization
    // --------------------------------------------------

    const organizationId = session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "You must have an active organization.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 4. Verify current user's membership + role
    // --------------------------------------------------

    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId,
        userId: user.id,
      },
      select: {
        role: true,
      },
    });

    if (!currentMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You are not a member of this organization.",
        "FORBIDDEN",
      );
    }

    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have permission to remove a team.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 5. Verify team belongs to active organization
    // --------------------------------------------------

    const team = await prisma.team.findFirst({
      where: {
        id: normalizedTeamId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Team not found.",
        "NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 6. Remove team through Better Auth
    // --------------------------------------------------

    const requestHeaders = await headers();

    await auth.api.removeTeam({
      body: {
        teamId: team.id,
      },
      headers: requestHeaders,
    });

    // --------------------------------------------------
    // 7. Return success
    // --------------------------------------------------

    return actionResponse(ACTION_STATUS.OK, null, "Team removed successfully.");
  } catch (error) {
    // --------------------------------------------------
    // 8. Handle Better Auth errors
    // --------------------------------------------------

    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to remove the team. Please try again.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 9. Handle unexpected errors
    // --------------------------------------------------

    console.error("[removeTeam] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
