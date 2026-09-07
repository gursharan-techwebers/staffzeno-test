"use server";

import { APIError } from "better-auth/api";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { prisma } from "@/lib/prisma";
import { getSession } from "../user/getSession";

type UpdateTeamMemberRoleInput = {
  teamId: string;
  memberId: string;
  role: "admin" | "member";
};

type UpdateTeamMemberRoleSuccess = {
  memberId: string;
  teamId: string;
  role: "admin" | "member";
};

export async function updateTeamMemberRole(
  input: UpdateTeamMemberRoleInput,
): Promise<ActionResult<UpdateTeamMemberRoleSuccess>> {
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
    // 3. Check current user's organization membership
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
    // 4. Only organization owner/admin can manage team
    // --------------------------------------------------

    const canManageTeam =
      currentMember.role === "owner" || currentMember.role === "admin";

    if (!canManageTeam) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to update team member roles.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 5. Find the TeamMember
    // --------------------------------------------------

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: input.memberId,
        teamId: team.id,
      },
      select: {
        id: true,
        teamId: true,
        userId: true,
        role: true,
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
    // 6. Verify the user belongs to the same organization
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
    // 7. No update necessary
    // --------------------------------------------------

    if (teamMember.role === input.role) {
      return actionResponse(
        ACTION_STATUS.OK,
        {
          memberId: teamMember.id,
          teamId: teamMember.teamId,
          role: teamMember.role,
        },
        "Team member role is already set to this role.",
      );
    }

    // --------------------------------------------------
    // 8. Update role
    // --------------------------------------------------

    const updatedMember = await prisma.teamMember.update({
      where: {
        id: teamMember.id,
      },
      data: {
        role: input.role,
      },
      select: {
        id: true,
        teamId: true,
        role: true,
      },
    });

    // --------------------------------------------------
    // 9. Return success
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      {
        memberId: updatedMember.id,
        teamId: updatedMember.teamId,
        role: updatedMember.role,
      },
      "Team member role updated successfully.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to update team member role.",
        "BAD_REQUEST",
      );
    }

    console.error("[updateTeamMemberRole] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
