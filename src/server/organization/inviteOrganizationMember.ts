"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import type { Invitation } from "@/types/organization/invitation";
import {
  inviteMemberSchema,
  type InviteMemberInput,
} from "@/validators/organization/invite";
import { prisma } from "@/lib/prisma";

import { canAddEmployee } from "../billing/canAddEmployee";
import { getSession } from "../user/getSession";

export type InviteMemberSuccess = Invitation;

export async function inviteOrganizationMember(
  input: InviteMemberInput,
): Promise<ActionResult<InviteMemberSuccess>> {
  // --------------------------------------------------
  // 1. Validate input
  // --------------------------------------------------
  const parsed = inviteMemberSchema.safeParse(input);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please fix the highlighted fields.",
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { email, title, teamId, role } = parsed.data;

  try {
    const requestHeaders = await headers();

    // --------------------------------------------------
    // 2. Check current session
    // --------------------------------------------------
    const session = await getSession();

    if (!session?.user) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to invite an employee.",
        "UNAUTHORIZED",
      );
    }

    // --------------------------------------------------
    // 3. Get active organization member
    // --------------------------------------------------
    const member = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!member) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "You are not a member of an active organization.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 4. Only owner and admin can invite employees
    // --------------------------------------------------
    const isOwnerOrAdmin = member.role === "owner" || member.role === "admin";

    if (!isOwnerOrAdmin) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to perform this action.",
        "FORBIDDEN",
      );
    }

    // --------------------------------------------------
    // 5. Get active organization
    // --------------------------------------------------
    const activeOrganization = await auth.api.getFullOrganization({
      headers: requestHeaders,
    });

    if (!activeOrganization) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "No active organization was found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 6. Team is required
    // --------------------------------------------------
    if (!teamId) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "Please select a team for the employee.",
        "TEAM_REQUIRED",
      );
    }

    // --------------------------------------------------
    // 7. Make sure team belongs to active organization
    // --------------------------------------------------
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId: activeOrganization.id,
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Selected team was not found.",
        "TEAM_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 8. Check employee limit
    // --------------------------------------------------
    const canAdd = await canAddEmployee(session.user.id, activeOrganization.id);

    if (!canAdd) {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "You have reached the employee limit for your current plan. Please upgrade your plan to invite another employee.",
        "LIMIT_REACHED",
      );
    }

    // --------------------------------------------------
    // 9. Create invitation
    // --------------------------------------------------
    const invitation = await auth.api.createInvitation({
      body: {
        email,
        role,
        organizationId: activeOrganization.id,
        title,
        teamId: team.id,
      },
      headers: requestHeaders,
    });

    // --------------------------------------------------
    // 10. Return invitation
    // --------------------------------------------------
    return actionResponse(
      ACTION_STATUS.OK,
      {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        title: invitation.title,
        status: invitation.status,
        organizationId: invitation.organizationId,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        teamId: invitation.teamId,
      },
      "Invitation sent successfully.",
    );
  } catch (error) {
    // --------------------------------------------------
    // 11. Handle Better Auth errors
    // --------------------------------------------------
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to send the invitation.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 12. Handle unexpected errors
    // --------------------------------------------------
    console.error("[inviteOrganizationMember] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
