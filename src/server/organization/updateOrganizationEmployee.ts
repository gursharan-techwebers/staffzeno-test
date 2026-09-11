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
import { OrganizationEmployeeRole } from "@/types/organization/team";

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
  try {
    const session = await getSession();

    if (!session?.user) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "Please log in to continue.",
        "UNAUTHORIZED",
      );
    }

    if (input.role !== "admin" && input.role !== "member") {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Invalid employee role.",
        "BAD_REQUEST",
      );
    }

    const title = input.title.trim();

    if (title.length > 100) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Employee title cannot exceed 100 characters.",
        "BAD_REQUEST",
      );
    }

    const requestHeaders = await headers();

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

    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to perform this action.",
        "FORBIDDEN",
      );
    }

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

    if (memberToUpdate.role === "owner") {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "The organization owner cannot be modified.",
        "FORBIDDEN",
      );
    }

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

    if (input.teamId) {
      await auth.api.addTeamMember({
        body: {
          teamId: input.teamId,
          userId: memberToUpdate.userId,
        },
        headers: requestHeaders,
      });
    }

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
    if (error instanceof APIError) {
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
