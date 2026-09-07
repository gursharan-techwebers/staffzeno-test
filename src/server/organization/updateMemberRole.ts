"use server";

import { APIError } from "better-auth/api";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { getSession } from "../user/getSession";

type UpdateMemberRoleInput = {
  organizationId: string;
  memberId: string;
  role: "admin" | "member";
};

type UpdateMemberRoleSuccess = {
  memberId: string;
  role: "admin" | "member";
};

export async function updateMemberRole(
  input: UpdateMemberRoleInput,
): Promise<ActionResult<UpdateMemberRoleSuccess>> {
  try {
    // 1. Get current session
    const session = await getSession();

    if (!session?.user) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "Please log in to continue.",
        "UNAUTHORIZED",
      );
    }

    // 2. Check whether the current user belongs to the organization
    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId: input.organizationId,
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

    // 3. Only owner and admin can update member roles
    const isOwnerOrAdmin =
      currentMember.role === "owner" || currentMember.role === "admin";

    if (!isOwnerOrAdmin) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to perform this action.",
        "FORBIDDEN",
      );
    }

    // 4. Find the member being updated
    const memberToUpdate = await prisma.member.findFirst({
      where: {
        id: input.memberId,
        organizationId: input.organizationId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!memberToUpdate) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Employee not found.",
        "NOT_FOUND",
      );
    }

    // 5. Never allow the organization owner to be changed
    if (memberToUpdate.role === "owner") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "The organization owner role cannot be changed.",
        "FORBIDDEN",
      );
    }

    // 6. Update the member role
    await prisma.member.update({
      where: {
        id: memberToUpdate.id,
      },
      data: {
        role: input.role,
      },
    });

    // 7. Return success
    return actionResponse(
      ACTION_STATUS.OK,
      {
        memberId: memberToUpdate.id,
        role: input.role,
      },
      "Employee role updated successfully.",
    );
  } catch (error) {
    // 8. Handle Better Auth errors
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to update employee role.",
        "BAD_REQUEST",
      );
    }

    // 9. Handle unexpected errors
    console.error("[updateMemberRole] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
