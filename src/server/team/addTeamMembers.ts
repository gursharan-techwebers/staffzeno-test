"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getAuthContext } from "../auth/getAuthContext";

type AddTeamMembersInput = {
  teamId: string;
  memberIds: string[];
};

type AddedTeamMember = {
  id: string;
  userId: string;
  teamId: string;
  role: "admin" | "member";
  title: string | null;
  createdAt: Date | null;
  name: string;
  email: string;
  image: string | null;
};

type AddTeamMembersSuccess = {
  teamId: string;
  members: AddedTeamMember[];
  addedCount: number;
};

export async function addTeamMembers(
  input: AddTeamMembersInput,
): Promise<ActionResult<AddTeamMembersSuccess>> {
  try {
    // --------------------------------------------------
    // 1. Validate input
    // --------------------------------------------------

    const teamId = input.teamId?.trim();
    const memberIds = [
      ...new Set(
        (input.memberIds ?? []).map((id) => id.trim()).filter(Boolean),
      ),
    ];

    if (!teamId) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Team ID is required.",
        "BAD_REQUEST",
      );
    }

    if (memberIds.length === 0) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Please select at least one member.",
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
    // 5. Only owner/admin can add team members
    // --------------------------------------------------

    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to add team members.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 6. Get selected organization members
    // --------------------------------------------------

    const organizationMembers = await prisma.member.findMany({
      where: {
        id: {
          in: memberIds,
        },
        organizationId: team.organizationId,
      },
      select: {
        id: true,
        userId: true,
        title: true,
      },
    });

    // Every selected member must belong to this organization.
    if (organizationMembers.length !== memberIds.length) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "One or more selected members do not belong to this organization.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 7. Find users already in the team
    // --------------------------------------------------

    const selectedUserIds = organizationMembers.map((member) => member.userId);

    const existingTeamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: team.id,
        userId: {
          in: selectedUserIds,
        },
      },
      select: {
        userId: true,
      },
    });

    const existingUserIds = new Set(
      existingTeamMembers.map((member) => member.userId),
    );

    const membersToAdd = organizationMembers.filter(
      (member) => !existingUserIds.has(member.userId),
    );

    if (membersToAdd.length === 0) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "All selected members are already in this team.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 8. Create team memberships atomically
    // --------------------------------------------------

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.createMany({
        data: membersToAdd.map((member) => ({
          id: crypto.randomUUID(),
          teamId: team.id,
          userId: member.userId,
          role: "member",
          createdAt: new Date(),
        })),
      });

      await tx.team.update({
        where: {
          id: team.id,
        },
        data: {
          memberCount: {
            increment: membersToAdd.length,
          },
        },
      });
    });

    // --------------------------------------------------
    // 9. Fetch newly added members
    // --------------------------------------------------

    const addedMembers = await prisma.teamMember.findMany({
      where: {
        teamId: team.id,
        userId: {
          in: membersToAdd.map((member) => member.userId),
        },
      },
      select: {
        id: true,
        userId: true,
        teamId: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // --------------------------------------------------
    // 10. Build response
    // --------------------------------------------------

    const titleByUserId = new Map(
      organizationMembers.map((member) => [member.userId, member.title]),
    );

    const members: AddedTeamMember[] = addedMembers.map((member) => ({
      id: member.id,
      userId: member.userId,
      teamId: member.teamId,
      role: member.role as "admin" | "member",
      title: titleByUserId.get(member.userId) ?? null,
      createdAt: member.createdAt,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
    }));

    // --------------------------------------------------
    // 11. Return success
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      {
        teamId: team.id,
        members,
        addedCount: members.length,
      },
      `${members.length} member${
        members.length === 1 ? "" : "s"
      } added to the team.`,
    );
  } catch (error) {
    console.error("[addTeamMembers] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
