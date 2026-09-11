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
import { getAuthContext } from "../auth/getAuthContext";

type CancelInvitationSuccess = {
  invitationId: string;
};

export async function cancelInvitation(
  invitationId: string,
): Promise<ActionResult<CancelInvitationSuccess>> {
  const normalizedInvitationId = invitationId?.trim();

  if (!normalizedInvitationId) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      "Invitation ID is required.",
      "BAD_REQUEST",
    );
  }

  try {
    // 1. Authenticate
    const authContext = await getAuthContext();

    if (!authContext) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        "You must be logged in.",
        "UNAUTHORIZED",
      );
    }

    const { session, user } = authContext;

    // 2. Get active organization
    const organizationId = session.activeOrganizationId;

    if (!organizationId) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You must have an active organization.",
        "FORBIDDEN",
      );
    }

    // 3. Verify organization membership and role
    const member = await prisma.member.findFirst({
      where: {
        organizationId,
        userId: user.id,
      },
      select: {
        role: true,
      },
    });

    if (!member) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You are not a member of this organization.",
        "FORBIDDEN",
      );
    }

    // 4. Only owner and admin can manage invitations
    const isOwnerOrAdmin = member.role === "owner" || member.role === "admin";

    if (!isOwnerOrAdmin) {
      return actionResponse(
        ACTION_STATUS.FORBIDDEN,
        "You don't have permission to perform this action.",
        "FORBIDDEN",
      );
    }

    // 5. Make sure invitation belongs to active organization
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: normalizedInvitationId,
        organizationId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!invitation) {
      return actionResponse(
        ACTION_STATUS.NOT_FOUND,
        "Invitation not found.",
        "INVALID_INVITATION",
      );
    }

    // 6. Only pending invitations can be cancelled
    if (invitation.status !== "pending") {
      return actionResponse(
        ACTION_STATUS.CONFLICT,
        "Only pending invitations can be cancelled.",
        "CONFLICT",
      );
    }

    // 7. Cancel using Better Auth
    const requestHeaders = await headers();

    await auth.api.cancelInvitation({
      body: {
        invitationId: invitation.id,
      },
      headers: requestHeaders,
    });

    return actionResponse(
      ACTION_STATUS.OK,
      {
        invitationId: invitation.id,
      },
      "Invitation cancelled successfully.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Unable to cancel the invitation.",
        "BAD_REQUEST",
      );
    }

    console.error("[cancelInvitation] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
