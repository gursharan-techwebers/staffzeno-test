"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { prisma } from "@/lib/prisma";
import { OrganizationEmployeeRole } from "@/types/organization/team";

import { getAuthContext } from "../auth/getAuthContext";

type UpdateTeamMemberRoleInput = {
  teamId: string;
  memberId: string;
  role: OrganizationEmployeeRole;
};

type UpdateTeamMemberRoleSuccess = {
  memberId: string;
  teamId: string;
  role: OrganizationEmployeeRole;
};

export async function updateTeamMemberRole(
  input: UpdateTeamMemberRoleInput,
): Promise<ActionResult<UpdateTeamMemberRoleSuccess>> {
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
    // 5. Only owner/admin can manage team
    // --------------------------------------------------

    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to update team member roles.",
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
        teamId: true,
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
    // 7. No update necessary
    // --------------------------------------------------

    if (teamMember.role === input.role) {
      return actionResponse(
        ACTION_STATUS.OK,
        {
          memberId: teamMember.id,
          teamId: teamMember.teamId,
          role: teamMember.role as OrganizationEmployeeRole,
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
        role: updatedMember.role as OrganizationEmployeeRole,
      },
      "Team member role updated successfully.",
    );
  } catch (error) {
    console.error("[updateTeamMemberRole] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
