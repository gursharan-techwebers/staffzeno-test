"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";

import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "../user/getSession";

type UpdateOrganizationEmployeeInput = {
  organizationId: string;
  memberId: string;
  role: "admin" | "member";
  teamId: string | null;
  title: string;
};

type UpdateOrganizationEmployeeSuccess = {
  memberId: string;
  role: "admin" | "member";
  teamId: string | null;
  title: string | null;
};

export async function updateOrganizationEmployee(
  input: UpdateOrganizationEmployeeInput,
): Promise<ActionResult<UpdateOrganizationEmployeeSuccess>> {
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
    // 2. Validate organization role
    // --------------------------------------------------
    if (input.role !== "admin" && input.role !== "member") {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Invalid employee role.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 3. Validate title
    // --------------------------------------------------
    const title = input.title.trim();

    if (title.length > 100) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Employee title cannot exceed 100 characters.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 4. Get request headers for Better Auth
    // --------------------------------------------------
    const requestHeaders = await headers();

    // --------------------------------------------------
    // 5. Check current user's organization membership
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 6. Only owner/admin can manage employees
    // --------------------------------------------------
    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to perform this action.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 7. Find employee
    // --------------------------------------------------
    const memberToUpdate = await prisma.member.findFirst({
      where: {
        id: input.memberId,
        organizationId: input.organizationId,
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
    // 8. Never modify organization owner
    // --------------------------------------------------
    if (memberToUpdate.role === "owner") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "The organization owner cannot be modified.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 9. Validate selected team
    // --------------------------------------------------
    if (input.teamId) {
      const team = await prisma.team.findFirst({
        where: {
          id: input.teamId,
          organizationId: input.organizationId,
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
    // 10. Update organization role and title
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
    // 11. Get existing team memberships
    // --------------------------------------------------
    const existingTeamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: memberToUpdate.userId,
        team: {
          organizationId: input.organizationId,
        },
      },
      select: {
        teamId: true,
      },
    });

    // --------------------------------------------------
    // 12. Remove existing team memberships
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
    // 13. Add employee to selected team
    // --------------------------------------------------
    if (input.teamId) {
      await auth.api.addTeamMember({
        body: {
          teamId: input.teamId,
          userId: memberToUpdate.userId,
        },
        headers: requestHeaders,
      });
    }

    // --------------------------------------------------
    // 14. Return updated employee data
    // --------------------------------------------------
    return actionResponse(
      ACTION_STATUS.OK,
      {
        memberId: updatedMember.id,
        role: updatedMember.role as "admin" | "member",
        teamId: input.teamId,
        title: updatedMember.title,
      },
      "Employee updated successfully.",
    );
  } catch (error) {
    // --------------------------------------------------
    // Better Auth errors
    // --------------------------------------------------
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to update employee.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // Unexpected errors
    // --------------------------------------------------
    console.error("[updateOrganizationEmployee] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
