"use server";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";

import { OrganizationEmployeeRole } from "@/types/organization/team";

import { getAuthContext } from "../auth/getAuthContext";

type UpdateMemberRoleInput = {
  organizationId: string;
  memberId: string;
  role: OrganizationEmployeeRole;
};

type UpdateMemberRoleSuccess = {
  memberId: string;
  role: OrganizationEmployeeRole;
};

export async function updateMemberRole(
  input: UpdateMemberRoleInput,
): Promise<ActionResult<UpdateMemberRoleSuccess>> {
  const organizationId = input.organizationId?.trim();
  const memberId = input.memberId?.trim();

  if (!organizationId || !memberId || !input.role) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Organization ID, member ID, and role are required.",
      "BAD_REQUEST",
    );
  }

  try {
    // 1. Get authenticated user/session
    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "Please log in to continue.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // 2. Only operate on the active organization
    const activeOrganizationId = session.activeOrganizationId;

    if (!activeOrganizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You must have an active organization.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    if (activeOrganizationId !== organizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "FORBIDDEN",
      );
    }

    // 3. Verify current user's membership and permission
    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId: activeOrganizationId,
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
        id: memberId,
        organizationId: activeOrganizationId,
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
    console.error("[updateMemberRole] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
