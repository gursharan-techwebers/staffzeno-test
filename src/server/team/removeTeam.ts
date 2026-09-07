"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { getSession } from "../user/getSession";

export async function removeTeam(teamId: string): Promise<ActionResult<null>> {
  if (!teamId?.trim()) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Team ID is required.",
      "BAD_REQUEST",
    );
  }

  try {
    const requestHeaders = await headers();

    // 1. Get current session
    const session = await getSession();

    if (!session) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to remove a team.",
        "UNAUTHORIZED",
      );
    }

    // 2. Get active organization
    const activeOrganization = await auth.api.getFullOrganization({
      headers: requestHeaders,
    });

    if (!activeOrganization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "You must have an active organization.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // 3. Verify current user's membership
    const currentMember = activeOrganization.members.find(
      (member) => member.userId === session.user.id,
    );

    if (!currentMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You are not a member of this organization.",
        "FORBIDDEN",
      );
    }

    // 4. Only owner and admin can remove teams
    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have permission to remove a team.",
        "FORBIDDEN",
      );
    }

    // 5. Verify team belongs to the active organization
    const team = activeOrganization.teams.find((team) => team.id === teamId);

    if (!team) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Team not found.",
        "NOT_FOUND",
      );
    }

    // 6. Remove team
    await auth.api.removeTeam({
      body: {
        teamId,
      },
      headers: requestHeaders,
    });

    // 7. Return success
    return actionResponse(ACTION_STATUS.OK, null, "Team removed successfully.");
  } catch (error) {
    // 8. Handle Better Auth errors
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to remove the team. Please try again.",
        "BAD_REQUEST",
      );
    }

    // 9. Handle unexpected errors
    console.error("[removeTeam] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
