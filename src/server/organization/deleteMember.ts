"use server";

import { APIError } from "better-auth/api";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";
import { getSession } from "../user/getSession";

export type DeleteMemberSuccess = {
  memberId: string;
};

export async function deleteMember(
  organizationId: string,
  memberId: string,
): Promise<ActionResult<DeleteMemberSuccess>> {
  try {
    // 1. Get current session
    const session = await getSession();

    if (!session?.user) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "Unauthorized. Please log in again.",
        "UNAUTHORIZED",
      );
    }

    // 2. Verify current user's membership and permissions
    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId,
        userId: session.user.id,
      },
      select: {
        id: true,
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

    // 3. Only organization owner and admin can remove members
    const isOwnerOrAdmin =
      currentMember.role === "owner" || currentMember.role === "admin";

    if (!isOwnerOrAdmin) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to perform this action.",
        "FORBIDDEN",
      );
    }

    // 4. Find the member inside this organization
    const memberToDelete = await prisma.member.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
      select: {
        id: true,
        role: true,
        userId: true,
      },
    });

    if (!memberToDelete) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Employee not found.",
        "NOT_FOUND",
      );
    }

    // 5. Never allow the organization owner to be removed
    if (memberToDelete.role === "owner") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "The organization owner cannot be removed.",
        "FORBIDDEN",
      );
    }

    // 6. Remove organization membership and all team memberships
    //    belonging to this user inside this organization.
    await prisma.$transaction(async (tx) => {
      // Find all team memberships for this user
      // only from teams belonging to this organization.
      const teamMemberships = await tx.teamMember.findMany({
        where: {
          userId: memberToDelete.userId,
          team: {
            organizationId,
          },
        },
        select: {
          teamId: true,
        },
      });

      // Delete the user's team memberships
      if (teamMemberships.length > 0) {
        await tx.teamMember.deleteMany({
          where: {
            userId: memberToDelete.userId,
            team: {
              organizationId,
            },
          },
        });

        // Keep Team.memberCount in sync
        for (const { teamId } of teamMemberships) {
          await tx.team.update({
            where: {
              id: teamId,
            },
            data: {
              memberCount: {
                decrement: 1,
              },
            },
          });
        }
      }

      // Delete organization membership
      await tx.member.delete({
        where: {
          id: memberToDelete.id,
        },
      });
    });

    // 7. Return structured success
    return actionResponse(
      ACTION_STATUS.OK,
      {
        memberId: memberToDelete.id,
      },
      "Employee removed successfully.",
    );
  } catch (error) {
    // 8. Handle Better Auth errors
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ??
          "Unable to remove the employee. Please try again.",
        "BAD_REQUEST",
      );
    }

    // 9. Handle unexpected errors
    console.error("[deleteMember] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
