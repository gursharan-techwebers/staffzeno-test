"use server";

import { APIError } from "better-auth/api";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { prisma } from "@/lib/prisma";
import { getSession } from "../user/getSession";

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
    // 1. Get current session
    // --------------------------------------------------

    const session = await getSession();

    if (!session?.user) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "Please log in to continue.",
        "UNAUTHORIZED",
      );
    }

    // --------------------------------------------------
    // 2. Get team and derive organization
    // --------------------------------------------------

    const team = await prisma.team.findUnique({
      where: {
        id: input.teamId,
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
    // 3. Check current user's membership in the
    //    team's organization
    // --------------------------------------------------

    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId: team.organizationId,
        userId: session.user.id,
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
    // 4. Only owner/admin can remove team members
    // --------------------------------------------------

    const canManageTeam =
      currentMember.role === "owner" || currentMember.role === "admin";

    if (!canManageTeam) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to remove team members.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 5. Find team member
    // --------------------------------------------------

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: input.memberId,
        teamId: team.id,
      },
      select: {
        id: true,
        userId: true,
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
    // 6. Verify the user belongs to the team's
    //    organization
    // --------------------------------------------------

    const organizationMember = await prisma.member.findFirst({
      where: {
        organizationId: team.organizationId,
        userId: teamMember.userId,
      },
      select: {
        id: true,
      },
    });

    if (!organizationMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "This team member does not belong to the team's organization.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 7. Remove TeamMember + decrement memberCount
    //    atomically
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
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to remove team member.",
        "BAD_REQUEST",
      );
    }

    console.error("[removeTeamMember] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
