"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { prisma } from "@/lib/prisma";
import type { Invitation } from "@/types/organization/invitation";
import {
  inviteMemberSchema,
  type InviteMemberInput,
} from "@/validators/organization/invite";

import { canAddEmployee } from "../billing/canAddEmployee";
import { getAuthContext } from "../auth/getAuthContext";

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

  if (!teamId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Please select a team for the employee.",
      "TEAM_REQUIRED",
    );
  }

  try {
    // --------------------------------------------------
    // 2. Authenticate current user
    // --------------------------------------------------

    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in to invite an employee.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // --------------------------------------------------
    // 3. Get active organization
    // --------------------------------------------------

    const organizationId = session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "No active organization was found.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 4. Verify current user's membership and permissions
    // --------------------------------------------------

    const currentMember = await prisma.member.findFirst({
      where: {
        organizationId,
        userId: user.id,
      },
      select: {
        role: true,
      },
    });

    if (!currentMember) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You are not a member of this organization.",
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

    // --------------------------------------------------
    // 5. Verify team belongs to active organization
    // --------------------------------------------------

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
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
    // 6. Check employee limit
    // --------------------------------------------------

    const canAdd = await canAddEmployee(user.id, organizationId);

    if (!canAdd) {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "You have reached the employee limit for your current plan. Please upgrade your plan to invite another employee.",
        "LIMIT_REACHED",
      );
    }

    // --------------------------------------------------
    // 7. Create invitation through Better Auth
    // --------------------------------------------------

    const requestHeaders = await headers();

    const invitation = await auth.api.createInvitation({
      body: {
        email,
        role,
        organizationId,
        title,
        teamId: team.id,
      },
      headers: requestHeaders,
    });

    // --------------------------------------------------
    // 8. Return invitation
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
    // 9. Handle Better Auth errors
    // --------------------------------------------------

    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to send the invitation.",
        "BAD_REQUEST",
      );
    }

    console.error("[inviteOrganizationMember] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
