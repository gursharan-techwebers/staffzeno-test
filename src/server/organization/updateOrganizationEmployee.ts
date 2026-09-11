"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { OrganizationEmployeeRole } from "@/types/organization/team";

import { getAuthContext } from "../auth/getAuthContext";

type UpdateOrganizationEmployeeInput = {
  organizationId: string;
  memberId: string;
  role: OrganizationEmployeeRole;
  teamId: string | null;
  title: string;
};

type UpdateOrganizationEmployeeSuccess = {
  memberId: string;
  role: OrganizationEmployeeRole;
  teamId: string | null;
  title: string | null;
};

export async function updateOrganizationEmployee(
  input: UpdateOrganizationEmployeeInput,
): Promise<ActionResult<UpdateOrganizationEmployeeSuccess>> {
  // --------------------------------------------------
  // 1. Validate input
  // --------------------------------------------------

  const organizationId = input.organizationId?.trim();
  const memberId = input.memberId?.trim();
  const teamId = input.teamId?.trim() || null;
  const title = input.title?.trim() ?? "";

  if (!organizationId || !memberId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Organization ID and member ID are required.",
      "BAD_REQUEST",
    );
  }

  if (input.role !== "admin" && input.role !== "member") {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Invalid employee role.",
      "BAD_REQUEST",
    );
  }

  if (title.length > 100) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Employee title cannot exceed 100 characters.",
      "BAD_REQUEST",
    );
  }

  try {
    // --------------------------------------------------
    // 2. Get authenticated user/session
    // --------------------------------------------------

    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "Please log in to continue.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // --------------------------------------------------
    // 3. Get active organization
    // --------------------------------------------------

    const activeOrganizationId = session.activeOrganizationId;

    if (!activeOrganizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You must have an active organization.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // Never trust organizationId supplied by the client
    if (activeOrganizationId !== organizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You do not have access to this organization.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 4. Verify current user's membership + permission
    // --------------------------------------------------

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

    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to perform this action.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 5. Find employee within active organization
    // --------------------------------------------------

    const memberToUpdate = await prisma.member.findFirst({
      where: {
        id: memberId,
        organizationId: activeOrganizationId,
      },
      select: {
        id: true,
        userId: true,
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

    // --------------------------------------------------
    // 6. Never modify organization owner
    // --------------------------------------------------

    if (memberToUpdate.role === "owner") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "The organization owner cannot be modified.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 7. Validate selected team
    // --------------------------------------------------

    if (teamId) {
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          organizationId: activeOrganizationId,
        },
        select: {
          id: true,
        },
      });

      if (!team) {
        return actionResponse(
          ACTION_STATUS.NOT_FOUND,
          "Selected team was not found.",
          "NOT_FOUND",
        );
      }
    }

    // --------------------------------------------------
    // 8. Get existing team memberships
    // --------------------------------------------------

    const existingTeamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: memberToUpdate.userId,
        team: {
          organizationId: activeOrganizationId,
        },
      },
      select: {
        teamId: true,
      },
    });

    // --------------------------------------------------
    // 9. Prepare Better Auth headers
    // --------------------------------------------------

    const requestHeaders = await headers();

    // --------------------------------------------------
    // 10. Update employee role/title
    // --------------------------------------------------

    const updatedMember = await prisma.member.update({
      where: {
        id: memberToUpdate.id,
      },
      data: {
        role: input.role,
        title: title || null,
      },
      select: {
        id: true,
        role: true,
        title: true,
      },
    });

    // --------------------------------------------------
    // 11. Remove existing team memberships
    // --------------------------------------------------

    for (const membership of existingTeamMemberships) {
      await auth.api.removeTeamMember({
        body: {
          teamId: membership.teamId,
          userId: memberToUpdate.userId,
        },
        headers: requestHeaders,
      });
    }

    // --------------------------------------------------
    // 12. Add new team membership
    // --------------------------------------------------

    if (teamId) {
      await auth.api.addTeamMember({
        body: {
          teamId,
          userId: memberToUpdate.userId,
        },
        headers: requestHeaders,
      });
    }

    // --------------------------------------------------
    // 13. Return success
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      {
        memberId: updatedMember.id,
        role: updatedMember.role as "admin" | "member",
        teamId,
        title: updatedMember.title,
      },
      "Employee updated successfully.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      console.error("[updateOrganizationEmployee] API error:", error);

      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to update employee.",
        "BAD_REQUEST",
      );
    }

    console.error("[updateOrganizationEmployee] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
