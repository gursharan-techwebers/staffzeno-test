"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { prisma } from "@/lib/prisma";
import { getAuthContext } from "../auth/getAuthContext";

type UpdateTeamInput = {
  teamId: string;
  name: string;
  adminUserIds: string[];
};

type UpdateTeamSuccess = {
  teamId: string;
  name: string;
  adminUserIds: string[];
};

export async function updateTeam(
  input: UpdateTeamInput,
): Promise<ActionResult<UpdateTeamSuccess>> {
  try {
    // --------------------------------------------------
    // 1. Validate input
    // --------------------------------------------------

    const teamId = input.teamId?.trim();
    const name = input.name?.trim();

    const adminUserIds = [
      ...new Set(
        (input.adminUserIds ?? [])
          .filter(
            (id): id is string =>
              typeof id === "string" && id.trim().length > 0,
          )
          .map((id) => id.trim()),
      ),
    ];

    if (!teamId) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Team ID is required.",
        "BAD_REQUEST",
      );
    }

    if (!name) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Team name is required.",
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
    // 5. Only owner/admin can manage teams
    // --------------------------------------------------

    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to manage this team.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 6. Get current team members
    // --------------------------------------------------

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: team.id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    // --------------------------------------------------
    // 7. Verify selected admins are team members
    // --------------------------------------------------

    const teamUserIds = new Set(teamMembers.map((member) => member.userId));

    const invalidAdminUserIds = adminUserIds.filter(
      (userId) => !teamUserIds.has(userId),
    );

    if (invalidAdminUserIds.length > 0) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "One or more selected admins are not members of this team.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 8. Synchronize team roles
    // --------------------------------------------------

    const adminTeamMemberIds = teamMembers
      .filter((member) => adminUserIds.includes(member.userId))
      .map((member) => member.id);

    await prisma.$transaction(async (tx) => {
      // Update team name
      await tx.team.update({
        where: {
          id: team.id,
        },
        data: {
          name,
        },
      });

      // Reset all members to regular members
      await tx.teamMember.updateMany({
        where: {
          teamId: team.id,
        },
        data: {
          role: "member",
        },
      });

      // Assign selected admins
      if (adminTeamMemberIds.length > 0) {
        await tx.teamMember.updateMany({
          where: {
            teamId: team.id,
            id: {
              in: adminTeamMemberIds,
            },
          },
          data: {
            role: "admin",
          },
        });
      }
    });

    // --------------------------------------------------
    // 9. Return success
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      {
        teamId: team.id,
        name,
        adminUserIds,
      },
      "Team updated successfully.",
    );
  } catch (error) {
    console.error("[updateTeam] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
