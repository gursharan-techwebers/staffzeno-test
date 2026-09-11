"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { prisma } from "@/lib/prisma";
import { getAuthContext } from "../auth/getAuthContext";

type RemoveTeamMemberInput = {
  teamId: string;
  memberId: string;
};

type RemoveTeamMemberSuccess = {
  teamId: string;
  memberId: string;
};

export async function removeTeamMember(
  input: RemoveTeamMemberInput,
): Promise<ActionResult<RemoveTeamMemberSuccess>> {
  try {
    // --------------------------------------------------
    // 1. Validate input
    // --------------------------------------------------

    const teamId = input.teamId?.trim();
    const memberId = input.memberId?.trim();

    if (!teamId) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Team ID is required.",
        "BAD_REQUEST",
      );
    }

    if (!memberId) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Member ID is required.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 2. Get authenticated user
    // --------------------------------------------------

    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "Please log in to continue.",
        "UNAUTHORIZED",
      );
    }

    const { user } = authContext;

    // --------------------------------------------------
    // 3. Get team
    // --------------------------------------------------

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        organizationId: true,
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
    // 4. Verify current user's organization membership
    // --------------------------------------------------

    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId: team.organizationId,
        userId: user.id,
      },
      select: {
        role: true,
      },
    });

    if (!currentMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 5. Only owner/admin can remove team members
    // --------------------------------------------------

    if (
      currentMember.role !== "owner" &&
      currentMember.role !== "admin"
    ) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to remove team members.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 6. Find team member scoped to this team
    // --------------------------------------------------

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId: team.id,
      },
      select: {
        id: true,
      },
    });

    if (!teamMember) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Team member not found.",
        "NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 7. Remove membership + update count atomically
    // --------------------------------------------------

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.delete({
        where: {
          id: teamMember.id,
        },
      });

      await tx.team.update({
        where: {
          id: team.id,
        },
        data: {
          memberCount: {
            decrement: 1,
          },
        },
      });
    });

    // --------------------------------------------------
    // 8. Return success
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      {
        teamId: team.id,
        memberId: teamMember.id,
      },
      "Team member removed successfully.",
    );
  } catch (error) {
    console.error(
      "[removeTeamMember] unexpected error:",
      error,
    );

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}