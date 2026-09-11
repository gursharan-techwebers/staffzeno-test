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

import { getAuthContext } from "../auth/getAuthContext";

export type ResendInvitationSuccess = Invitation;

export async function resendInvitation(
  invitationId: string,
): Promise<ActionResult<ResendInvitationSuccess>> {
  const normalizedInvitationId = invitationId?.trim();

  if (!normalizedInvitationId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Invitation ID is required.",
      "INVALID_INVITATION",
    );
  }

  try {
    // --------------------------------------------------
    // 1. Authenticate current user
    // --------------------------------------------------

    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // --------------------------------------------------
    // 2. Get active organization
    // --------------------------------------------------

    const organizationId = session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "You are not a member of an active organization.",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    // --------------------------------------------------
    // 3. Verify current user's membership and permissions
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

    // --------------------------------------------------
    // 4. Find invitation inside active organization
    // --------------------------------------------------

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: normalizedInvitationId,
        organizationId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        title: true,
        status: true,
        organizationId: true,
        teamId: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!invitation) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Invitation not found.",
        "INVALID_INVITATION",
      );
    }

    // --------------------------------------------------
    // 5. Only pending invitations can be resent
    // --------------------------------------------------

    if (invitation.status !== "pending") {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "Only pending invitations can be resent.",
        "CONFLICT",
      );
    }

    // --------------------------------------------------
    // 6. Invitation title is required
    // --------------------------------------------------

    if (!invitation.title) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        "The invitation title is missing and cannot be resent.",
        "BAD_REQUEST",
      );
    }

    // --------------------------------------------------
    // 7. Cancel old invitation
    // --------------------------------------------------

    const requestHeaders = await headers();

    await auth.api.cancelInvitation({
      body: {
        invitationId: invitation.id,
      },
      headers: requestHeaders,
    });

    // --------------------------------------------------
    // 8. Create fresh invitation
    // --------------------------------------------------

    const newInvitation = await auth.api.createInvitation({
      body: {
        email: invitation.email,
        role: "member",
        organizationId: invitation.organizationId,
        title: invitation.title,
        ...(invitation.teamId
          ? {
              teamId: invitation.teamId,
            }
          : {}),
      },
      headers: requestHeaders,
    });

    // --------------------------------------------------
    // 9. Return newly created invitation
    // --------------------------------------------------

    return actionResponse(
      ACTION_STATUS.OK,
      {
        id: newInvitation.id,
        email: newInvitation.email,
        role: newInvitation.role,
        title: newInvitation.title,
        status: newInvitation.status,
        organizationId: newInvitation.organizationId,
        expiresAt: newInvitation.expiresAt,
        createdAt: newInvitation.createdAt,
        teamId: newInvitation.teamId,
      },
      "Invitation resent successfully.",
    );
  } catch (error) {
    // --------------------------------------------------
    // 10. Handle Better Auth errors
    // --------------------------------------------------

    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to resend the invitation.",
        "BAD_REQUEST",
      );
    }

    console.error("[resendInvitation] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
