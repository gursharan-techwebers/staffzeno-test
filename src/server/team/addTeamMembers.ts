"use server";

import { APIError } from "better-auth/api";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getSession } from "../user/getSession";

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

    // Remove duplicate member IDs
    const memberIds = [...new Set(input.memberIds)];

    if (memberIds.length === 0) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Please select at least one member.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 2. Get the team and derive its organization
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
    // 4. Only organization owner/admin can add members
    // --------------------------------------------------

    const canManageTeam =
      currentMember.role === "owner" ||
      currentMember.role === "admin";

    if (!canManageTeam) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to add team members.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 5. Get the selected members from THIS organization
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

    // Every selected member must belong to this organization
    if (organizationMembers.length !== memberIds.length) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "One or more selected members do not belong to this organization.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 6. Check which selected users are already in team
    // --------------------------------------------------

    const selectedUserIds = organizationMembers.map(
      (member) => member.userId,
    );

    const existingTeamMembers =
      await prisma.teamMember.findMany({
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
      existingTeamMembers.map(
        (member) => member.userId,
      ),
    );

    // --------------------------------------------------
    // 7. Only add users who aren't already in team
    // --------------------------------------------------

    const membersToAdd = organizationMembers.filter(
      (member) =>
        !existingUserIds.has(member.userId),
    );

    if (membersToAdd.length === 0) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "All selected members are already in this team.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 8. Create TeamMember records + update count
    //    atomically
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
    // 9. Fetch the newly created team members
    // --------------------------------------------------

    const addedMembers =
      await prisma.teamMember.findMany({
        where: {
          teamId: team.id,
          userId: {
            in: membersToAdd.map(
              (member) => member.userId,
            ),
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
    // 10. Convert to TeamMember shape expected by UI
    // --------------------------------------------------

    const members: AddedTeamMember[] =
      addedMembers.map((member) => {
        const organizationMember =
          organizationMembers.find(
            (orgMember) =>
              orgMember.userId === member.userId,
          );

        return {
          id: member.id,
          userId: member.userId,
          teamId: member.teamId,
          role: member.role,
          title:
            organizationMember?.title ?? null,
          createdAt: member.createdAt,

          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
        };
      });

    // --------------------------------------------------
    // 11. Return created members
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
    // --------------------------------------------------
    // 12. Handle Better Auth errors
    // --------------------------------------------------

    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ??
          "Unable to add team members.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 13. Handle unexpected errors
    // --------------------------------------------------

    console.error(
      "[addTeamMembers] unexpected error:",
      error,
    );

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}