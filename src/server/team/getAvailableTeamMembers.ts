"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { prisma } from "@/lib/prisma";
import { getSession } from "../user/getSession";

export type AvailableTeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  organizationRole: string;
  title: string | null;
};

type GetAvailableTeamMembersInput = {
  teamId: string;
};

export async function getAvailableTeamMembers(
  input: GetAvailableTeamMembersInput,
): Promise<ActionResult<AvailableTeamMember[]>> {
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
    // 2. Get team and derive organization from the team
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
    // 3. Check current user's membership in the team's
    //    organization
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
    // 4. Only organization owner/admin can manage teams
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
    // 5. Get users already assigned to this team
    // --------------------------------------------------

    const existingTeamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: team.id,
      },
      select: {
        userId: true,
      },
    });

    const existingUserIds = existingTeamMembers.map((member) => member.userId);

    // --------------------------------------------------
    // 6. Get ONLY members from this team's organization
    //    who are NOT already in this team
    // --------------------------------------------------

    const organizationMembers = await prisma.member.findMany({
      where: {
        organizationId: team.organizationId,
        userId: {
          notIn: existingUserIds,
        },
      },
      select: {
        id: true,
        userId: true,
        role: true,
        title: true,
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    // --------------------------------------------------
    // 7. Convert to response shape
    // --------------------------------------------------

    const availableMembers: AvailableTeamMember[] = organizationMembers.map(
      (member) => ({
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        organizationRole: member.role,
        title: member.title,
      }),
    );

    // --------------------------------------------------
    // 8. Return available members
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      availableMembers,
      "Available team members fetched successfully.",
    );
  } catch (error) {
    console.error("[getAvailableTeamMembers] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Unable to load organization members.",
      "UNKNOWN_ERROR",
    );
  }
}
