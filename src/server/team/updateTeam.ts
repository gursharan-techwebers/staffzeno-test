"use server";

import { APIError } from "better-auth/api";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { prisma } from "@/lib/prisma";
import { getSession } from "../user/getSession";

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
    // 2. Validate input
    // --------------------------------------------------

    const name = input.name.trim();

    const adminUserIds = [
      ...new Set(
        input.adminUserIds.filter(
          (id): id is string => typeof id === "string" && id.length > 0,
        ),
      ),
    ];

    if (!name) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Team name is required.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 3. Find team and derive organization
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
    // 4. Check current user's organization membership
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
    // 5. Only organization owner/admin can manage team
    // --------------------------------------------------

    const canManageTeam =
      currentMember.role === "owner" || currentMember.role === "admin";

    if (!canManageTeam) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to manage this team.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 6. Get all current team members
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
    // 7. Validate selected admin users belong to this team
    // --------------------------------------------------

    const teamUserIds = new Set(teamMembers.map((member) => member.userId));

    const invalidAdminUserIds = adminUserIds.filter(
      (userId) => !teamUserIds.has(userId),
    );

    if (invalidAdminUserIds.length > 0) {
      console.error("[updateTeam] Invalid admin user IDs:", {
        teamId: team.id,
        adminUserIds,
        teamUserIds: [...teamUserIds],
        invalidAdminUserIds,
      });

      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "One or more selected admins are not members of this team.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 8. Verify all team members belong to organization
    // --------------------------------------------------

    if (teamMembers.length > 0) {
      const organizationMembers = await prisma.member.findMany({
        where: {
          organizationId: team.organizationId,
          userId: {
            in: teamMembers.map((member) => member.userId),
          },
        },
        select: {
          userId: true,
        },
      });

      const organizationUserIds = new Set(
        organizationMembers.map((member) => member.userId),
      );

      const invalidTeamMembers = teamMembers.filter(
        (member) => !organizationUserIds.has(member.userId),
      );

      if (invalidTeamMembers.length > 0) {
        return actionResponse(
          ACTION_STATUS.FORBIDDEN,
          "One or more team members do not belong to the team's organization.",
          "FORBIDDEN",
        );
      }
    }

    // --------------------------------------------------
    // 9. Convert selected User IDs to TeamMember IDs
    // --------------------------------------------------

    const adminTeamMemberIds = teamMembers
      .filter((member) => adminUserIds.includes(member.userId))
      .map((member) => member.id);

    // --------------------------------------------------
    // 10. Update team + synchronize ALL roles
    // --------------------------------------------------

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

      // Reset all team members to regular members
      await tx.teamMember.updateMany({
        where: {
          teamId: team.id,
        },
        data: {
          role: "member",
        },
      });

      // Set selected users as admins
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
    // 11. Return success
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
    if (error instanceof APIError) {
      console.error("[updateTeam] APIError:", error);

      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to update team.",
        "BAD_REQUEST",
      );
    }

    console.error("[updateTeam] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
