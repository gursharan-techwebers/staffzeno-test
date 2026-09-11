"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { prisma } from "@/lib/prisma";
import { getAuthContext } from "../auth/getAuthContext";

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
    // 1. Validate input
    // --------------------------------------------------

    const teamId = input.teamId?.trim();

    if (!teamId) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Team ID is required.",
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
    // 4. Verify organization membership + permission
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

    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to manage this team.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 5. Get existing team members
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
    // 6. Get available organization members
    // --------------------------------------------------

    const organizationMembers = await prisma.member.findMany({
      where: {
        organizationId: team.organizationId,
        ...(existingUserIds.length > 0
          ? {
              userId: {
                notIn: existingUserIds,
              },
            }
          : {}),
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
    // 7. Return response
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
